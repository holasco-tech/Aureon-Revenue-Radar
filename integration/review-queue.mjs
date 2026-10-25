// Owner-only read endpoint for pending assessments. No outbound contact.
const respond=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export async function handleReviewQueue(request,env,session){
 if(!session?.authenticated||!session?.canReviewLeads)return respond({error:'unauthorized'},401);
 if(request.method!=='GET')return respond({error:'method_not_allowed'},405);
 if(!env?.AUREON_DB)return respond({error:'database_unavailable'},503);
 if(!session.businessId||typeof session.businessId!=='string')return respond({error:'invalid_session'},403);
 const url=new URL(request.url);
 const requestedLimit=Number(url.searchParams.get('limit')||25);
 if(!Number.isInteger(requestedLimit)||requestedLimit<1||requestedLimit>100)return respond({error:'invalid_limit'},400);
 const cursor=url.searchParams.get('before');
 if(cursor!==null&&(!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d$/.test(cursor)))return respond({error:'invalid_cursor'},400);
 const sql=`SELECT a.business_id,a.external_id,a.score,a.priority,a.suggested_action,a.model_version,a.review_state,a.created_at,
 l.lead_name,l.service,l.source,l.lead_status,l.lead_value
 FROM integration_lead_assessments a
 JOIN integration_leads l ON l.business_id=a.business_id AND l.external_id=a.external_id
 WHERE a.business_id=?1 AND a.review_state='pending_human_approval'
 ORDER BY a.created_at DESC,a.external_id ASC LIMIT ?2`;
 try{
  const statement=env.AUREON_DB.prepare(sql);
  const result=await statement.bind(session.businessId,requestedLimit).all();
  return respond({ok:true,items:result.results||[],count:(result.results||[]).length});
 }catch{return respond({error:'database_error'},500);}
}
