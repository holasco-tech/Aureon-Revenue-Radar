import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('./intake.js', import.meta.url), 'utf8');
const { handleN8nLead } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

globalThis.crypto ??= webcrypto;

function mockDb() {
  const events = new Map(), leads = new Map();
  return {
    events, leads,
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values=args; return this; },
        async first() {
          if (!sql.startsWith('SELECT lead_key FROM integration_events')) throw Error('unexpected select');
          const key=values.join(':');
          return events.has(key) ? {lead_key:events.get(key)} : null;
        },
        get sql() { return sql; },
        get values() { return values; }
      };
    },
    async batch(statements) {
      const [event,lead]=statements;
      const [source,id,, ,leadKey]=event.values;
      const eventKey=source+':'+id;
      if (events.has(eventKey)) throw Error('duplicate');
      events.set(eventKey,leadKey);
      leads.set(leadKey,lead.values);
      return [{success:true},{success:true}];
    }
  };
}
const env=db=>({AUREON_DB:db,AUREON_INGEST_TOKEN:'test-secret',AUREON_INGEST_BUSINESS:'Test Business'});
const payload=(id='same-id',source='website')=>({event_id:id,source,lead:{name:'Synthetic Tester',service:'Consultation',contact:'synthetic@example.invalid',value:25}});
const send=(db,body,token='test-secret')=>handleN8nLead(new Request('https://example.invalid/api/integrations/leads',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)}),env(db));

test('rejects invalid credentials without writing',async()=>{const db=mockDb();assert.equal((await send(db,payload(),'wrong')).status,401);assert.equal(db.events.size,0);});
test('accepts a new lead and ignores exact replay',async()=>{const db=mockDb();assert.equal((await send(db,payload())).status,202);assert.equal((await send(db,payload())).status,200);assert.equal(db.events.size,1);assert.equal(db.leads.size,1);});
test('same event id from different sources is accepted',async()=>{const db=mockDb();assert.equal((await send(db,payload('same','website'))).status,202);assert.equal((await send(db,payload('same','gmail'))).status,202);assert.equal(db.events.size,2);});
test('invalid value is rejected',async()=>{const db=mockDb();const p=payload();p.lead.value=-5;assert.equal((await send(db,p)).status,400);assert.equal(db.events.size,0);});
test('rejects oversized JSON',async()=>{const db=mockDb();const p=payload();p.extra='x'.repeat(17000);assert.equal((await send(db,p)).status,413);});
