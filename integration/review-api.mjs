// Authenticated review API prototype. This module is NOT wired to the deployed Worker.
// Session identity is supplied by an upstream verified authentication middleware.
import {applyReview} from './human-review.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function handleReviewRequest(request,env,session){
 if(!session||session.authenticated!==true||typeof session.reviewerId!=='string'||!session.reviewerId.trim())
  return json({ok:false,error:'unauthorized'},401);
 if(!session.canReviewLeads)return json({ok:false,error:'forbidden'},403);
 if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
 if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/json')
  return json({ok:false,error:'unsupported_media_type'},415);
 if(Number(request.headers.get('content-length')||0)>4096)return json({ok:false,error:'payload_too_large'},413);
 let input;
 try{const raw=await request.text();if(raw.length>4096)return json({ok:false,error:'payload_too_large'},413);input=JSON.parse(raw);}
 catch{return json({ok:false,error:'invalid_json'},400);}
 if(!input||typeof input!=='object'||Array.isArray(input))return json({ok:false,error:'invalid_payload'},400);
 if(input.reviewerId!==undefined&&input.reviewerId!==session.reviewerId)return json({ok:false,error:'reviewer_spoofing'},403);
 if(session.businessId!==input.businessId)return json({ok:false,error:'forbidden_business'},403);
 const review={businessId:input.businessId,externalId:input.externalId,decision:input.decision,reason:input.reason,reviewerId:session.reviewerId};
 try{
  const result=await applyReview(env.AUREON_DB,review,'review_'+crypto.randomUUID().replace(/-/g,''));
  if(!result.ok)return json(result,result.error==='not_found'?404:409);
  return json(result);
 }catch(error){
  if(String(error).includes('Invalid '))return json({ok:false,error:'invalid_review'},400);
  return json({ok:false,error:'internal_error'},500);
 }
}
