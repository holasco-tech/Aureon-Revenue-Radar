import {createHmac,randomUUID} from 'node:crypto';

// For use in a self-hosted n8n Code node that supports Node crypto.
// Never paste the secret into an exported public workflow.
export function signLeadRequest(secret, lead, now=Date.now()) {
  if (typeof secret!=='string'||secret.length<32) throw new Error('Secret must be at least 32 characters');
  const timestamp=String(Math.floor(now/1000));
  const requestId=randomUUID();
  const body=JSON.stringify(lead);
  const signature=createHmac('sha256',secret).update(timestamp+'.'+requestId+'.'+body).digest('hex');
  return {body,headers:{'content-type':'application/json','x-aureon-timestamp':timestamp,'x-aureon-request-id':requestId,'x-aureon-signature':signature}};
}
