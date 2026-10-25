// n8n intake handler. Configure AUREON_INGEST_TOKEN and AUREON_INGEST_BUSINESS as Worker secrets.
// Apply integrations/n8n/ingestion-schema.sql before enabling the route.
const reply = (body, status=200) => Response.json(body,{status,headers:{"cache-control":"no-store"}});
async function sameSecret(a,b) {
  const encoder=new TextEncoder();
  const [x,y]=await Promise.all([crypto.subtle.digest("SHA-256",encoder.encode(a)),crypto.subtle.digest("SHA-256",encoder.encode(b))]);
  return Array.from(new Uint8Array(x)).every((v,i)=>v===new Uint8Array(y)[i]);
}
export async function handleN8nLead(request,env) {
  if(!env.AUREON_DB||!env.AUREON_INGEST_TOKEN||!env.AUREON_INGEST_BUSINESS) return reply({error:"Integration not configured"},503);
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")||!(await sameSecret(auth.slice(7),env.AUREON_INGEST_TOKEN))) return reply({error:"Unauthorized"},401);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json")) return reply({error:"JSON required"},415);
  const raw=await request.text();
  if(raw.length>16000) return reply({error:"Payload too large"},413);
  let body;
  try { body=JSON.parse(raw); } catch { return reply({error:"Invalid JSON"},400); }
  const valid=(v,max)=>typeof v==="string"&&v.trim().length>0&&v.length<=max;
  if(!valid(body?.event_id,160)||!valid(body?.source,40)||!valid(body?.lead?.name,100)||!valid(body?.lead?.service,100)) return reply({error:"Invalid lead fields"},400);
  if(!/^[a-zA-Z0-9_.:-]+$/.test(body.event_id)||!/^[a-zA-Z0-9_-]+$/.test(body.source)) return reply({error:"Invalid event identifiers"},400);
  const business=String(env.AUREON_INGEST_BUSINESS).trim().slice(0,80);
  if(!business) return reply({error:"Business not configured"},503);
  const source=body.source.trim(),eventId=body.event_id.trim(),name=body.lead.name.trim(),service=body.lead.service.trim();
  const contact=typeof body.lead.contact==="string"?body.lead.contact.trim():"";
  if(contact.length>200) return reply({error:"Contact too long"},400);
  const value=body.lead.value===undefined?0:Number(body.lead.value);
  if(!Number.isFinite(value)||value<0||value>1000000000) return reply({error:"Invalid value"},400);
  const identity=contact||eventId;
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(business+"|"+source+"|"+identity)));
  const key="intake:"+Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
  const existing=await env.AUREON_DB.prepare("SELECT lead_key FROM integration_events WHERE integration_id=? AND event_id=?").bind("default",eventId).first().catch(()=>null);
  if(existing) return reply({ok:true,duplicate:true});
  try {
    await env.AUREON_DB.batch([
      env.AUREON_DB.prepare("INSERT INTO integration_events (integration_id,event_id,business_name,source,lead_key) VALUES (?,?,?,?,?)").bind("default",eventId,business,source,key),
      env.AUREON_DB.prepare("INSERT INTO leads (lead_key,business_name,lead_name,service,lead_value,lead_status,days,last_activity,priority,created_at,updated_at) VALUES (?,?,?,?,?,'New inquiry',NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(lead_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP").bind(key,business,name,service,value)
    ]);
    return reply({ok:true,accepted:true},202);
  } catch {
    const replay=await env.AUREON_DB.prepare("SELECT lead_key FROM integration_events WHERE integration_id=? AND event_id=?").bind("default",eventId).first().catch(()=>null);
    return replay?reply({ok:true,duplicate:true}):reply({error:"Database ingestion failed"},503);
  }
}
