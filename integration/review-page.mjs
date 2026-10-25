// Owner review page. Escapes all lead data; no automatic outbound actions.
export const reviewPageHtml=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aureon — Lead Review</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#0b1020;color:#f5f7ff}
body{margin:0;padding:20px;max-width:960px;margin-inline:auto}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
h1{font-size:1.6rem}p{color:#b9c3da}a{color:#e4bf67}
button,textarea{font:inherit}button{background:#e4bf67;color:#171a23;border:0;border-radius:8px;padding:10px 14px;cursor:pointer}
button:disabled{opacity:.5;cursor:not-allowed}
.card{background:#151d31;border:1px solid #34415c;border-radius:14px;padding:16px;margin:14px 0}
.meta{color:#b9c3da;font-size:.9rem}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
textarea{box-sizing:border-box;width:100%;background:#0b1020;color:#fff;border:1px solid #52627e;border-radius:8px;padding:10px;min-height:70px}
.reject{background:#ffb4b4}#status{min-height:1.5rem}
</style></head><body>
<header><h1>Lead Review Queue</h1><a href="/">Dashboard</a></header>
<p>Review suggestions manually. Approving a lead does not send messages or execute workflows.</p>
<button id="refresh">Refresh pending leads</button><p id="status" role="status" aria-live="polite"></p><main id="items"></main>
<script>
const status=document.getElementById('status'),items=document.getElementById('items');
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node};
async function load(){
 status.textContent='Loading…';items.replaceChildren();
 try{
  const res=await fetch('/api/integrations/review-queue',{credentials:'same-origin',cache:'no-store'});
  if(res.status===401){location.replace('/');return}
  if(!res.ok)throw Error('Queue unavailable ('+res.status+')');
  const data=await res.json();status.textContent=data.count+' pending lead(s)';
  for(const lead of data.items){
   const card=el('section',undefined,'card');
   card.append(el('h2',lead.lead_name||lead.external_id),el('p','Priority: '+lead.priority+' · Score: '+lead.score,'meta'),
    el('p','Service: '+(lead.service||'—')+' · Source: '+(lead.source||'—')+' · Value: '+(lead.lead_value??'—'),'meta'),
    el('p','Suggested action: '+(lead.suggested_action||'None')));
   const reason=el('textarea');reason.placeholder='Required reason for your decision';reason.maxLength=500;
   reason.setAttribute('aria-label','Review reason for '+(lead.lead_name||lead.external_id));
   const actions=el('div',undefined,'actions');
   for(const decision of ['approved','rejected']){
    const btn=el('button',decision==='approved'?'Approve':'Reject',decision==='rejected'?'reject':'');
    btn.addEventListener('click',async()=>{
     if(!reason.value.trim()){status.textContent='Enter a reason first.';reason.focus();return}
     if(!confirm((decision==='approved'?'Approve':'Reject')+' this lead? No customer message will be sent.'))return;
     for(const b of actions.querySelectorAll('button'))b.disabled=true;
     try{
      const response=await fetch('/api/integrations/reviews',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({businessId:lead.business_id,externalId:lead.external_id,decision,reason:reason.value.trim()})});
      if(response.status===401){location.replace('/');return}
      if(!response.ok)throw Error('Review not saved ('+response.status+')');
      await load();
     }catch(err){status.textContent=err.message;for(const b of actions.querySelectorAll('button'))b.disabled=false}
    });actions.append(btn);
   }
   card.append(reason,actions);items.append(card);
  }
 }catch(err){status.textContent=err.message}
}
document.getElementById('refresh').addEventListener('click',load);load();
</script></body></html>`;
