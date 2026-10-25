import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const html = readFileSync(new URL('../demo/index.html', import.meta.url),'utf8');
const workflow = JSON.parse(readFileSync(new URL('../n8n/aureon-radar-local-demo.json', import.meta.url),'utf8'));
test('static demo is clearly fictional and has no network requests',()=>{
 assert.match(html,/DEMO ONLY/);
 assert.match(html,/Fictional data/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 new Script(scripts[0][1]);
 assert.doesNotMatch(scripts[0][1],/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/);
 assert.match(scripts[0][1],/textContent/);
});
test('n8n workflow is importable, inactive and makes no outbound calls',()=>{
 assert.equal(workflow.active,false);
 assert.equal(workflow.nodes.length,3);
 assert.ok(workflow.nodes.some(n=>n.type==='n8n-nodes-base.webhook'));
 assert.ok(workflow.nodes.every(n=>['n8n-nodes-base.webhook','n8n-nodes-base.code'].includes(n.type)));
 assert.ok(workflow.nodes.every(n=>!JSON.stringify(n.parameters).includes('https://')));
 const names=new Set(workflow.nodes.map(n=>n.name));
 for(const [name,conn] of Object.entries(workflow.connections)){assert.ok(names.has(name));for(const branch of conn.main)for(const edge of branch)assert.ok(names.has(edge.node));}
});

test('website lead demo remains offline and fictional',()=>{
 const form=readFileSync(new URL('../demo/website-lead.html',import.meta.url),'utf8');
 assert.match(form,/FICTIONAL DATA ONLY/);
 assert.match(form,/No details are transmitted/);
 assert.doesNotMatch(form,/<form[^>]+action=/i);
 const scripts=[...form.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 new Script(scripts[0][1]);
 assert.doesNotMatch(scripts[0][1],/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/);
 assert.match(scripts[0][1],/businessId:'demo_business'/);
 assert.match(scripts[0][1],/textContent/);
});
