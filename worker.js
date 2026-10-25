import { normalizeIncomingLead, webhookTimestampValid, verifyWebhookSignature } from './integration/lead-webhook.mjs';
const SESSION_COOKIE = 'aureon_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const loginHtml = String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aureon Revenue Radar V0.9.0 — Owner Login</title>
<style>
:root{--bg:#0b1020;--panel:#151d31;--text:#fff;--muted:#aeb7c9;--line:#303a55;--gold:#e4bf67;--ok:#9de0b6;--err:#ff9e9e}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at top,#17213c 0,#0b1020 55%);font-family:Arial,sans-serif;color:var(--text)}
.card{width:min(100%,430px);background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.brand{font-size:34px;font-weight:800;line-height:1}.gold{color:var(--gold)}.small{color:var(--muted);font-size:13px;line-height:1.5}.lock{margin:18px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:#10172a}
label{display:block;color:var(--muted);font-size:12px;margin:18px 0 7px}input{width:100%;padding:13px;border-radius:10px;border:1px solid var(--line);background:#0e1527;color:#fff;font-size:16px;outline:none}input:focus{border-color:var(--gold)}
button{width:100%;margin-top:12px;padding:13px 15px;border:0;border-radius:10px;background:var(--gold);font-weight:800;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}#message{min-height:22px;margin-top:12px;font-size:13px}.err{color:var(--err)}.ok{color:var(--ok)}
</style>
</head>
<body>
<div class="card">
  <div class="brand">Aureon<br><span class="gold">Revenue Radar</span></div>
  <div class="small" style="margin-top:8px">V0.9.0 · Protected Owner Access · Persistent Workspace</div>
  <div class="lock"><b>Owner sign-in</b><div class="small" style="margin-top:5px">Enter the private Aureon owner password to open the Revenue Radar workspace.</div></div>
  <form id="loginForm">
    <label for="password">Owner password</label>
    <input id="password" type="password" autocomplete="current-password" maxlength="200" required autofocus>
    <button id="loginBtn" type="submit">Open Revenue Radar</button>
  </form>
  <div id="message"></div>
</div>
<script>
const form=document.getElementById('loginForm');
const password=document.getElementById('password');
const btn=document.getElementById('loginBtn');
const message=document.getElementById('message');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const value=password.value;
  if(!value)return;
  btn.disabled=true;
  message.textContent='Checking owner access...';
  message.className='';
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:value})});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Sign-in failed.');
    message.textContent='Access confirmed. Opening Aureon...';
    message.className='ok';
    location.replace('/');
  }catch(err){
    message.textContent=err.message;
    message.className='err';
    password.select();
  }finally{btn.disabled=false;}
});
</script>
</body>
</html>`;

const html = String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aureon Revenue Radar V0.9.0</title>
<style>
:root{--bg:#0b1020;--panel:#151d31;--panel2:#1a2440;--text:#fff;--muted:#aeb7c9;--line:#303a55;--gold:#e4bf67;--high:#ff667f;--high-bg:#681d2b;--medium:#e8bb4f;--medium-bg:#61450d;--low:#54d896;--low-bg:#15553a;--blue:#7fa7ff}
*{box-sizing:border-box}body{font-family:Arial,sans-serif;background:var(--bg);color:var(--text);margin:0;padding:20px}main{max-width:1180px;margin:auto}h1{font-size:40px;line-height:1;margin:0 0 7px}.small{color:var(--muted);font-size:13px}
.headerRow{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}.accountBox,.stat,.section{background:var(--panel);border:1px solid var(--line);border-radius:16px}.accountBox{padding:12px;min-width:min(100%,360px)}.accountBox label{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}.accountBox input,.toolbar input,.toolbar select,.askrow input{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:#0e1527;color:#fff}.ownerRow{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:10px}.ownerPill{display:inline-block;padding:5px 9px;border-radius:999px;border:1px solid #386a4c;background:#143923;color:#bff6d1;font-size:12px;font-weight:700}
.notice{background:#172a22;border:1px solid #386a4c;color:#bff6d1;padding:11px;border-radius:10px;margin-top:12px;font-size:13px}.section{padding:16px;margin-top:16px}.upload{border:1px dashed #52607f;border-radius:14px;padding:18px;text-align:center;background:#10172a}.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.stat{padding:16px;min-height:105px}.label{color:var(--muted);font-size:13px}.num{font-size:29px;font-weight:bold;margin-top:10px}
.toolbar{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}.toolbarRow{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.check{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:13px}.actionSummary{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.summaryPill,.pill{display:inline-block;padding:5px 9px;border-radius:999px;border:1px solid var(--line);font-size:12px;color:var(--muted);background:#10172a}.summaryPill.ok{color:#9de0b6}.summaryPill.err{color:#ff9e9e}.summaryPill.warn{color:#ffd27b}
.grid{display:grid;gap:10px;margin-top:12px}.card{background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:14px}.card.priority-High{border-left:4px solid var(--high)}.card.priority-Medium{border-left:4px solid var(--medium)}.card.priority-Low{border-left:4px solid var(--low)}.top{display:flex;justify-content:space-between;gap:12px}.name{font-size:17px;font-weight:bold}.service{color:var(--muted);font-size:14px;margin-top:4px}.money{font-size:18px;font-weight:bold}.meta{display:grid;gap:6px;margin-top:11px;font-size:14px}.row{display:flex;justify-content:space-between;gap:10px}.row span:first-child{color:var(--muted)}
.badge{display:inline-block;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid}.badge.High{color:#ffe1e6;background:var(--high-bg);border-color:var(--high)}.badge.Medium{color:#fff0bf;background:var(--medium-bg);border-color:var(--medium)}.badge.Low{color:#d9ffe9;background:var(--low-bg);border-color:var(--low)}
.actionBadge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid var(--line)}.actionBadge.Not-contacted{color:#d6dcea;background:#273149}.actionBadge.Contacted{color:#dce7ff;background:#243b70;border-color:var(--blue)}.actionBadge.Won{color:#d9ffe9;background:var(--low-bg);border-color:var(--low)}.actionBadge.Lost{color:#ffe1e6;background:#4d2530;border-color:#ad5b6b}
button{padding:11px 15px;border:0;border-radius:10px;background:var(--gold);font-weight:bold;cursor:pointer}button.secondary{background:#10172a;color:#fff;border:1px solid var(--line)}button:disabled{opacity:.55;cursor:not-allowed}.cardActions,.leadActionButtons{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.actionBtn{padding:8px 10px;font-size:12px}.actionBtn.selected[data-status="Not contacted"]{border-color:#8794b2;background:#273149}.actionBtn.selected[data-status="Contacted"]{border-color:var(--blue);background:#243b70}.actionBtn.selected[data-status="Won"]{border-color:var(--low);background:var(--low-bg)}.actionBtn.selected[data-status="Lost"]{border-color:#ad5b6b;background:#4d2530}.resetBtn{padding:8px 10px;font-size:12px}.logoutBtn{padding:7px 10px;font-size:12px}
.detail{display:none;margin-top:12px;padding:12px;border-radius:12px;background:#10172a;border:1px solid var(--line);line-height:1.5;font-size:14px}.detail.show{display:block}.askrow{display:flex;gap:8px;margin-top:12px}.askrow input{flex:1;min-width:0}#answer{white-space:pre-wrap;line-height:1.55;background:#10172a;border:1px solid var(--line);border-radius:12px;padding:14px;min-height:90px}.empty{padding:18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);text-align:center}.ok{color:#9de0b6}.err{color:#ff9e9e}.warn{color:#ffd27b}
.pager{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}.pagerInfo{color:var(--muted);font-size:13px;text-align:center;min-width:180px}.temporaryNote{margin-top:12px;color:var(--muted);font-size:12px}
@media(min-width:800px){.stats{grid-template-columns:repeat(4,1fr)}.grid{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:2fr 1fr 1fr 1fr}.toolbarRow{grid-column:1/-1}}
</style>
</head>
<body>
<main>
<div class="headerRow">
  <div><h1>Aureon<br>Revenue Radar</h1><div class="small">V0.9.0 · Persistent Lead Workspace · Signed Owner Session · D1 Storage · Gemini AI</div></div>
  <div class="accountBox">
    <label for="businessName">Business / account name</label>
    <input id="businessName" maxlength="80" value="" placeholder="Enter business name">
    <div id="businessNameHelp" class="small" style="margin-top:6px">Auto-filled from CSV when available. Otherwise enter it manually.</div>
    <div class="ownerRow"><span class="ownerPill">Owner session protected</span><button class="secondary logoutBtn" onclick="logout()">Log out</button></div>
  </div>
</div>
<div class="notice">V0.9 security and persistent storage are active. Imported lead records can now reload automatically from Aureon D1 after sign-in. Continue using only fake or anonymized data during the demo stage.</div>
<div class="section">
  <h2>1. Lead workspace</h2>
  <div class="upload">
    <div><b>Import a CSV once, then Aureon can restore the saved workspace automatically</b></div>
    <div class="small" style="margin-top:6px">Recommended columns: Business Name, Name, Service, Value, Status, Days, Last Activity, Priority</div>
    <input id="file" type="file" accept=".csv,text/csv">
    <div id="fileStatus" class="small" style="margin-top:9px">Checking for a saved workspace...</div>
    <div id="validationStatus" class="small" style="margin-top:6px"></div>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="label">Leads analyzed</div><div id="leadCount" class="num">0</div></div>
  <div class="stat"><div class="label">Active recovery potential</div><div id="totalValue" class="num">$0</div></div>
  <div class="stat"><div class="label">Active high priority</div><div id="highCount" class="num">0</div></div>
  <div class="stat"><div class="label">Active high-priority value</div><div id="highValue" class="num">$0</div></div>
</div>
<div class="section">
<h2>2. Revenue opportunities</h2>
<div class="toolbar">
<input id="searchInput" placeholder="Search name, service, status..." oninput="filtersChanged()">
<select id="priorityFilter" onchange="filtersChanged()"><option value="All">All priorities</option><option value="High">High priority</option><option value="Medium">Medium priority</option><option value="Low">Low priority</option></select>
<select id="sortFilter" onchange="filtersChanged()"><option value="score">Sort: Aureon priority</option><option value="value">Sort: Highest value</option><option value="age">Sort: Oldest first</option><option value="recent">Sort: Most recent</option></select>
<select id="actionFilter" onchange="filtersChanged()"><option value="All">All action statuses</option><option value="Not contacted">Not contacted</option><option value="Contacted">Contacted</option><option value="Won">Won</option><option value="Lost">Lost</option></select>
<div class="toolbarRow"><label class="check"><input id="staleOnly" type="checkbox" onchange="filtersChanged()">Show stale active leads only (7+ days)</label><span id="visibleCount" class="pill">0 matching</span><button class="secondary" onclick="clearFilters()">Clear filters</button></div>
</div>
<div class="actionSummary"><span id="notContactedCount" class="summaryPill">Not contacted: 0</span><span id="contactedCount" class="summaryPill">Contacted: 0</span><span id="wonCount" class="summaryPill">Won: 0</span><span id="lostCount" class="summaryPill">Lost: 0</span><span id="wonValue" class="summaryPill">Won value: $0</span><span id="saveState" class="summaryPill">Storage: ready</span></div>
<div class="temporaryNote">V0.9 stores the imported lead records in D1. After a refresh or a new sign-in, Aureon can restore the latest saved workspace without requiring the CSV again.</div>
<div id="cards" class="grid"><div class="empty">Aureon is checking for saved leads. You can also import a CSV.</div></div>
<div id="pager" class="pager" style="display:none"><button id="prevBtn" class="secondary" onclick="changePage(-1)">← Previous</button><div id="pagerInfo" class="pagerInfo">Showing 0 leads</div><button id="nextBtn" class="secondary" onclick="changePage(1)">Next →</button></div>
</div>
<div class="section">
<h2>3. Ask Aureon</h2>
<div id="answer">Aureon is checking for a saved workspace. You can also import a CSV.</div>
<div class="askrow"><input id="q" maxlength="600" placeholder="Which 3 leads should I focus on first, and why?"><button id="askBtn" onclick="ask()" disabled>Ask</button></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="secondary" onclick="preset('Which 3 leads should I focus on first, and why?')">Top 3</button><button class="secondary" onclick="preset('Which high-priority leads have not been contacted?')">Not contacted</button><button class="secondary" onclick="preset('Which opportunities are becoming stale and need attention now?')">Stale leads</button><button class="secondary" onclick="preset('Give me a short action plan for today.')">Today's plan</button></div>
</div>
</main>
<script>
let leads=[];let csvWarnings=[];let currentPage=1;let workspaceSource='empty';const PAGE_SIZE=10;
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function money(v){return '$'+Number(v||0).toLocaleString()}
function businessName(){return document.getElementById('businessName').value.trim()}
function leadKey(l,biz=businessName()){return [biz,l.name,l.service].map(x=>String(x||'').trim().toLowerCase()).join('||').slice(0,500)}
function setSaveState(text,state=''){const el=document.getElementById('saveState');if(!el)return;el.textContent=text;el.className='summaryPill'+(state?' '+state:'')}
function hasKnownDays(l){return Number.isFinite(l.days)}
function ageText(l){return hasKnownDays(l)?l.days+' day'+(l.days===1?'':'s'):'Not provided'}
function normalizeActionStatus(s){const x=String(s||'').trim().toLowerCase();if(x==='contacted')return 'Contacted';if(x==='won'||x==='recovered'||x==='closed won')return 'Won';if(x==='lost'||x==='closed lost')return 'Lost';return 'Not contacted'}
function actionClass(s){return normalizeActionStatus(s).replace(/\s+/g,'-')}
async function aureonFetch(url,options){const r=await fetch(url,options);if(r.status===401){location.replace('/');throw new Error('Owner session expired. Sign in again.')}return r}
async function logout(){try{await fetch('/api/logout',{method:'POST'});}finally{location.replace('/')}}
function splitCSVLine(line){const out=[];let cur='';let quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out}
function autoPriority(x){const s=(x.status||'').toLowerCase();let score=0;if(x.value>=3000)score+=3;else if(x.value>=1000)score+=2;else if(x.value>0)score+=1;if(s.includes('estimate')||s.includes('callback')||s.includes('quote'))score+=2;if(s.includes('missed')||s.includes('no response')||s.includes('unbooked'))score+=1;if(Number.isFinite(x.days)){if(x.days>=3&&x.days<=14)score+=2;else if(x.days>14)score+=1}return score>=5?'High':score>=3?'Medium':'Low'}
function isClosed(l){return l.actionStatus==='Won'||l.actionStatus==='Lost'}
function leadScore(l){const p={High:30,Medium:20,Low:10}[l.priority]||0;const s=(l.status||'').toLowerCase();let intent=0;if(s.includes('callback'))intent=12;else if(s.includes('estimate'))intent=10;else if(s.includes('quote'))intent=9;else if(s.includes('missed'))intent=7;else if(s.includes('no response'))intent=5;else if(s.includes('unbooked'))intent=4;else if(s.includes('old customer'))intent=2;let recency=0;if(hasKnownDays(l)){if(l.days<=3)recency=8;else if(l.days<=7)recency=6;else if(l.days<=14)recency=4;else if(l.days<=30)recency=2}const value=Math.min(30,Math.max(0,Number(l.value)||0)/250);const actionAdjustment=l.actionStatus==='Contacted'?-2:isClosed(l)?-100:0;return Number(p)+Number(intent)+Number(recency)+Number(value)+actionAdjustment}
function safeActionFor(l){if(l.actionStatus==='Won')return 'No recovery follow-up needed. This lead is marked Won.';if(l.actionStatus==='Lost')return 'No recovery follow-up recommended. This lead is marked Lost.';const s=(l.status||'').toLowerCase();const last=(l.last||'').trim();const agePhrase=hasKnownDays(l)&&l.days>0?' from '+l.days+' days ago':'';if(s.includes('callback'))return 'Follow up on the callback request'+agePhrase+'.';if(s.includes('estimate'))return 'Follow up on the existing estimate'+agePhrase+'.';if(s.includes('quote'))return 'Follow up on the quote request'+agePhrase+'.';if(s.includes('missed'))return 'Follow up on the missed inbound contact'+agePhrase+'.';if(s.includes('no response'))return 'Follow up on the unanswered lead'+(last?' regarding: '+last:'')+'.';if(s.includes('unbooked'))return 'Follow up on the unbooked inquiry'+(last?' regarding: '+last:'')+'.';if(s.includes('old customer'))return 'Re-engage this existing customer'+(last?' regarding: '+last:'')+'.';if(last)return 'Follow up based on the recorded activity: '+last+'.';return 'Review this lead and follow up using the recorded information.'}
function reasonFor(l){const bits=[];if(l.priority)bits.push(l.priority+' priority');if(l.value>0)bits.push(money(l.value)+' potential value');bits.push('action status: '+l.actionStatus);const s=(l.status||'').toLowerCase();if(s.includes('callback'))bits.push('customer requested a callback');else if(s.includes('estimate'))bits.push('estimate already exists');else if(s.includes('quote'))bits.push('quote intent is recorded');else if(s.includes('missed'))bits.push('missed inbound opportunity');else if(s.includes('no response'))bits.push('lead has not responded');else if(s.includes('unbooked'))bits.push('inquiry is still unbooked');else if(s.includes('old customer'))bits.push('existing customer re-engagement opportunity');if(hasKnownDays(l)&&l.days>0)bits.push(l.days+' days since recorded activity');if(!hasKnownDays(l))bits.push('age/recency was not provided');return bits.join('; ')+'.'}
function parseCSV(text){csvWarnings=[];const lines=text.replace(/\r/g,'').split('\n').filter(x=>x.trim()!=='');if(lines.length<2)throw new Error('CSV needs a header row and at least one lead.');const headers=splitCSVLine(lines[0]).map(h=>h.trim());const map={};headers.forEach((h,i)=>map[norm(h)]=i);const find=aliases=>{for(const a of aliases){const n=norm(a);if(map[n]!==undefined)return map[n]}return -1};const idx={business:find(['business name','business','company','company name','account','account name','organization','organisation','contractor','contractor name']),name:find(['name','customer','customer name','lead','lead name']),service:find(['service','service needed','job','job type','service type']),value:find(['value','estimate amount','estimate','job value','potential value','amount']),status:find(['status','lead status','stage']),days:find(['days','days since contact','age','days old']),last:find(['last activity','last contact','last action','activity']),priority:find(['priority','lead priority']),action:find(['action status','follow-up status','follow up status','aureon status'])};if(idx.name<0)throw new Error('Aureon could not find a Name/Customer column.');if(idx.business<0)csvWarnings.push('No Business Name/Company/Account column found — enter the business name manually.');if(idx.value<0)csvWarnings.push('No Value column found — potential revenue will show as $0 where unavailable.');if(idx.status<0)csvWarnings.push('No Status column found — recommendations will be less precise.');if(idx.days<0)csvWarnings.push('No Days/Age column found — age will show as Not provided and no recency score will be added.');if(idx.last<0)csvWarnings.push('No Last Activity column found.');if(idx.priority<0)csvWarnings.push('No Priority column found — Aureon will calculate priority automatically.');const result=[];const businessNames=[];for(let i=1;i<lines.length&&result.length<250;i++){const c=splitCSVLine(lines[i]);const name=(c[idx.name]||'').trim();if(!name){csvWarnings.push('Skipped a row with no customer/lead name.');continue}if(idx.business>=0){const bn=(c[idx.business]||'').trim();if(bn)businessNames.push(bn)}const rawVal=idx.value>=0?String(c[idx.value]||'').replace(/[$,]/g,''):'0';let value=Number(rawVal);if(!Number.isFinite(value))value=0;let days=null;if(idx.days>=0){const rawDays=String(c[idx.days]??'').trim();if(rawDays!==''){const parsedDays=Number(rawDays.replace(/[^0-9.-]/g,''));if(Number.isFinite(parsedDays)&&parsedDays>=0)days=parsedDays}}const status=idx.status>=0?(c[idx.status]||'Unknown').trim():'Unknown';let priority=idx.priority>=0?(c[idx.priority]||'').trim():'';if(!['High','Medium','Low'].includes(priority))priority=autoPriority({value,days,status});const actionStatus=idx.action>=0?normalizeActionStatus(c[idx.action]):'Not contacted';result.push({_id:'lead-'+i,name,service:idx.service>=0?(c[idx.service]||'Unknown service').trim():'Unknown service',value,status,days,last:idx.last>=0?(c[idx.last]||'').trim():'',priority,actionStatus})}if(!result.length)throw new Error('No usable lead rows were found in the CSV.');const uniqueBusinessNames=[...new Set(businessNames.map(x=>x.trim()).filter(Boolean))];if(uniqueBusinessNames.length>1)csvWarnings.push('More than one business/account name was found. Aureon used the first one: '+uniqueBusinessNames[0]+'.');return{leads:result,businessName:uniqueBusinessNames[0]||''}}
function isStaleActive(l){return !isClosed(l)&&hasKnownDays(l)&&l.days>=7&&!String(l.status||'').toLowerCase().includes('old customer')}
function filteredLeads(){const q=document.getElementById('searchInput').value.trim().toLowerCase();const p=document.getElementById('priorityFilter').value;const a=document.getElementById('actionFilter').value;const stale=document.getElementById('staleOnly').checked;let arr=leads.filter(l=>{const hay=[l.name,l.service,l.status,l.last,l.priority,l.actionStatus].join(' ').toLowerCase();if(q&&!hay.includes(q))return false;if(p!=='All'&&l.priority!==p)return false;if(a!=='All'&&l.actionStatus!==a)return false;if(stale&&!isStaleActive(l))return false;return true});const sort=document.getElementById('sortFilter').value;if(sort==='value')arr.sort((a,b)=>(b.value||0)-(a.value||0));else if(sort==='age')arr.sort((a,b)=>{const ak=hasKnownDays(a),bk=hasKnownDays(b);if(ak&&!bk)return -1;if(!ak&&bk)return 1;if(!ak&&!bk)return 0;return b.days-a.days});else if(sort==='recent')arr.sort((a,b)=>{const ak=hasKnownDays(a),bk=hasKnownDays(b);if(ak&&!bk)return -1;if(!ak&&bk)return 1;if(!ak&&!bk)return 0;return a.days-b.days});else arr.sort((a,b)=>leadScore(b)-leadScore(a)||(b.value||0)-(a.value||0));return arr}
function filtersChanged(){currentPage=1;render()}
function clearFilters(){document.getElementById('searchInput').value='';document.getElementById('priorityFilter').value='All';document.getElementById('sortFilter').value='score';document.getElementById('actionFilter').value='All';document.getElementById('staleOnly').checked=false;currentPage=1;render()}
function toggleDetail(id){document.getElementById(id).classList.toggle('show')}
async function setActionStatus(id,status){const lead=leads.find(x=>x._id===id);if(!lead)return;const previous=lead.actionStatus;lead.actionStatus=normalizeActionStatus(status);render();setSaveState('Storage: saving...','warn');try{const r=await aureonFetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({leadKey:leadKey(lead),businessName:businessName(),lead:{name:lead.name,service:lead.service,value:lead.value},actionStatus:lead.actionStatus})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Save failed.');setSaveState('Storage: saved','ok')}catch(e){lead.actionStatus=previous;render();setSaveState('Storage: save failed','err');const vs=document.getElementById('validationStatus');vs.textContent='Aureon could not permanently save that lead action: '+e.message;vs.className='small err'}}
function resetActionStatus(id){setActionStatus(id,'Not contacted')}
async function loadSavedActions(){const biz=businessName();if(!leads.length||!biz){setSaveState('Storage: waiting for business name');return}setSaveState('Storage: loading...','warn');try{const r=await aureonFetch('/api/actions?businessName='+encodeURIComponent(biz));const d=await r.json();if(!r.ok)throw new Error(d.error||'Load failed.');const saved=new Map((d.actions||[]).map(x=>[x.lead_key,normalizeActionStatus(x.action_status)]));for(const lead of leads){const savedStatus=saved.get(leadKey(lead,biz));if(savedStatus)lead.actionStatus=savedStatus}render();setSaveState('Storage: saved actions loaded','ok')}catch(e){setSaveState('Storage: load failed','err');const vs=document.getElementById('validationStatus');vs.textContent='CSV loaded, but saved lead actions could not be restored: '+e.message;vs.className='small err'}}
function storedLeadToClient(x,i){return{_id:'stored-'+i,name:String(x.lead_name||''),service:String(x.service||'Unknown service'),value:Number(x.lead_value)||0,status:String(x.lead_status||'Unknown'),days:(x.days===null||x.days===undefined||x.days==='')?null:Number(x.days),last:String(x.last_activity||''),priority:['High','Medium','Low'].includes(String(x.priority||''))?String(x.priority):'Low',actionStatus:normalizeActionStatus(x.action_status)}}
async function saveCurrentLeadsToD1(){const biz=businessName();if(!biz||!leads.length)return false;setSaveState('Storage: saving lead workspace...','warn');const r=await aureonFetch('/api/leads/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({businessName:biz,leads:leads.map(l=>({name:l.name,service:l.service,value:l.value,status:l.status,days:hasKnownDays(l)?l.days:null,last:l.last,priority:l.priority}))})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save lead workspace.');setSaveState('Storage: lead workspace saved','ok');return true}
async function loadPersistentWorkspace(preferredBusiness=''){const st=document.getElementById('fileStatus');const vs=document.getElementById('validationStatus');const bh=document.getElementById('businessNameHelp');try{st.textContent='Checking Aureon D1 for saved leads...';st.className='small';const qs=preferredBusiness?'?businessName='+encodeURIComponent(preferredBusiness):'';const r=await aureonFetch('/api/leads'+qs);const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load saved workspace.');if(!Array.isArray(d.leads)||!d.leads.length){if(!leads.length){workspaceSource='empty';st.textContent='No saved workspace yet. Import a CSV once to create one.';st.className='small';vs.textContent='';document.getElementById('answer').textContent='No saved leads yet. Import a CSV to create the persistent V0.9 workspace.';setSaveState('Storage: ready')}return false}leads=d.leads.slice(0,250).map(storedLeadToClient);currentPage=1;workspaceSource='stored';document.getElementById('businessName').value=String(d.businessName||'').slice(0,80);bh.textContent='Business workspace restored from Aureon D1.';bh.className='small ok';render();st.textContent='Loaded '+leads.length+' saved leads from Aureon D1. No CSV re-upload needed.';st.className='small ok';vs.textContent='Persistent workspace restored successfully.';vs.className='small ok';document.getElementById('answer').textContent='Saved workspace loaded'+(businessName()?' for '+businessName():'')+'. Aureon is ready to analyze these '+leads.length+' leads.';setSaveState('Storage: persistent workspace loaded','ok');return true}catch(e){if(!leads.length){st.textContent='Saved workspace could not be loaded: '+e.message;st.className='small err';vs.textContent='You can still import a CSV.';vs.className='small warn';setSaveState('Storage: workspace load failed','err')}return false}}
function changePage(delta){const arr=filteredLeads();const totalPages=Math.max(1,Math.ceil(arr.length/PAGE_SIZE));currentPage=Math.min(totalPages,Math.max(1,currentPage+delta));render();document.getElementById('cards').scrollIntoView({behavior:'smooth',block:'start'})}
function renderActionSummary(){const counts={notContacted:0,contacted:0,won:0,lost:0,wonValue:0};for(const l of leads){if(l.actionStatus==='Contacted')counts.contacted++;else if(l.actionStatus==='Won'){counts.won++;counts.wonValue+=Number(l.value)||0}else if(l.actionStatus==='Lost')counts.lost++;else counts.notContacted++}document.getElementById('notContactedCount').textContent='Not contacted: '+counts.notContacted;document.getElementById('contactedCount').textContent='Contacted: '+counts.contacted;document.getElementById('wonCount').textContent='Won: '+counts.won;document.getElementById('lostCount').textContent='Lost: '+counts.lost;document.getElementById('wonValue').textContent='Won value: '+money(counts.wonValue)}
function render(){const cards=document.getElementById('cards');cards.innerHTML='';const active=leads.filter(l=>!isClosed(l));const activeTotal=active.reduce((s,x)=>s+(Number(x.value)||0),0);const activeHighs=active.filter(x=>x.priority==='High');const activeHighValue=activeHighs.reduce((s,x)=>s+(Number(x.value)||0),0);document.getElementById('leadCount').textContent=leads.length;document.getElementById('totalValue').textContent=money(activeTotal);document.getElementById('highCount').textContent=activeHighs.length;document.getElementById('highValue').textContent=money(activeHighValue);renderActionSummary();const arr=filteredLeads();document.getElementById('visibleCount').textContent=arr.length+' matching';const totalPages=Math.max(1,Math.ceil(arr.length/PAGE_SIZE));if(currentPage>totalPages)currentPage=totalPages;if(currentPage<1)currentPage=1;const start=(currentPage-1)*PAGE_SIZE;const end=Math.min(start+PAGE_SIZE,arr.length);const pageItems=arr.slice(start,end);const pager=document.getElementById('pager');const pagerInfo=document.getElementById('pagerInfo');const prevBtn=document.getElementById('prevBtn');const nextBtn=document.getElementById('nextBtn');if(arr.length>PAGE_SIZE){pager.style.display='flex';pagerInfo.textContent='Showing '+(start+1)+'–'+end+' of '+arr.length+' leads · Page '+currentPage+' of '+totalPages;prevBtn.disabled=currentPage<=1;nextBtn.disabled=currentPage>=totalPages}else pager.style.display='none';if(!arr.length)cards.innerHTML='<div class="empty">No leads match the current filters.</div>';pageItems.forEach((l,i)=>{const id='detail-'+currentPage+'-'+i;const d=document.createElement('div');d.className='card priority-'+l.priority;d.innerHTML='<div class="top"><div><div class="name"></div><div class="service"></div></div><div class="money"></div></div><div class="meta"><div class="row"><span>Status</span><span class="status"></span></div><div class="row"><span>Last activity</span><span class="last"></span></div><div class="row"><span>Age</span><span class="days"></span></div><div class="row"><span>Priority</span><span><span class="badge '+l.priority+'"></span></span></div><div class="row"><span>Lead action</span><span><span class="actionBadge '+actionClass(l.actionStatus)+'"></span></span></div></div><div class="cardActions"><button class="secondary reviewBtn">Why ranked?</button><span class="pill scorePill"></span></div><div class="leadActionButtons"><button class="secondary actionBtn" data-status="Not contacted">Not contacted</button><button class="secondary actionBtn" data-status="Contacted">Contacted</button><button class="secondary actionBtn" data-status="Won">Won</button><button class="secondary actionBtn" data-status="Lost">Lost</button><button class="secondary resetBtn">Reset</button></div><div id="'+id+'" class="detail"><div><b>Why Aureon ranked this lead</b></div><div class="why"></div><div style="margin-top:10px"><b>Recommended next action</b></div><div class="action"></div></div>';d.querySelector('.name').textContent=l.name;d.querySelector('.service').textContent=l.service;d.querySelector('.money').textContent=money(l.value);d.querySelector('.status').textContent=l.status;d.querySelector('.last').textContent=l.last||'Not provided';d.querySelector('.days').textContent=ageText(l);d.querySelector('.badge').textContent=l.priority;d.querySelector('.actionBadge').textContent=l.actionStatus;d.querySelector('.scorePill').textContent=isClosed(l)?'Closed · '+l.actionStatus:'Aureon score: '+Math.round(leadScore(l));d.querySelector('.why').textContent=reasonFor(l);d.querySelector('.action').textContent=safeActionFor(l);d.querySelector('.reviewBtn').onclick=()=>toggleDetail(id);d.querySelectorAll('.actionBtn').forEach(btn=>{if(btn.dataset.status===l.actionStatus)btn.classList.add('selected');btn.onclick=()=>setActionStatus(l._id,btn.dataset.status)});d.querySelector('.resetBtn').onclick=()=>resetActionStatus(l._id);cards.appendChild(d)});document.getElementById('askBtn').disabled=leads.length===0}
function preset(t){document.getElementById('q').value=t}
document.getElementById('file').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const st=document.getElementById('fileStatus');const vs=document.getElementById('validationStatus');const bh=document.getElementById('businessNameHelp');st.textContent='Reading '+f.name+'...';st.className='small';vs.textContent='';try{const parsed=parseCSV(await f.text());leads=parsed.leads;currentPage=1;workspaceSource='csv';if(parsed.businessName){document.getElementById('businessName').value=parsed.businessName;bh.textContent='Business name detected from the uploaded CSV.';bh.className='small ok'}else{document.getElementById('businessName').value='';bh.textContent='No business name found in the CSV. Enter it manually to save this workspace permanently.';bh.className='small warn'}render();if(businessName()){await saveCurrentLeadsToD1();await loadSavedActions()}else{setSaveState('Storage: waiting for business name','warn')}st.textContent='Loaded '+leads.length+' leads from '+f.name+(businessName()?' and saved them permanently.':'.');st.className='small ok';if(csvWarnings.length){vs.textContent='Validation notes: '+[...new Set(csvWarnings)].slice(0,4).join(' | ');vs.className='small warn'}else{vs.textContent=businessName()?'CSV validation passed. Persistent lead workspace saved.':'CSV validation passed. Enter a business name to enable permanent lead storage.';vs.className=businessName()?'small ok':'small warn'}document.getElementById('answer').textContent='CSV loaded'+(businessName()?' for '+businessName():'')+'. Aureon is ready to analyze these '+leads.length+' leads.'}catch(err){leads=[];currentPage=1;workspaceSource='empty';render();document.getElementById('businessName').value='';bh.textContent='Auto-filled from CSV when available. Otherwise enter it manually.';bh.className='small';st.textContent='Upload failed: '+err.message;st.className='small err';vs.textContent='';document.getElementById('answer').textContent='Upload failed: '+err.message}})
document.getElementById('businessName').addEventListener('change',async()=>{if(!leads.length)return;if(workspaceSource==='csv'&&businessName()){const st=document.getElementById('fileStatus');const vs=document.getElementById('validationStatus');try{await saveCurrentLeadsToD1();await loadSavedActions();st.textContent='Business name added. The current lead workspace is now saved permanently.';st.className='small ok';vs.textContent='Persistent workspace saved successfully.';vs.className='small ok'}catch(e){vs.textContent='Could not save the persistent workspace: '+e.message;vs.className='small err'}}})
async function ask(){const q=document.getElementById('q').value.trim();if(!q||!leads.length)return;const a=document.getElementById('answer');const btn=document.getElementById('askBtn');a.textContent='Aureon is thinking...';btn.disabled=true;try{const r=await aureonFetch('/api/ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:q,leads,businessName:businessName()})});const d=await r.json();a.textContent=d.answer||d.error||'No answer returned.'}catch(e){a.textContent='Connection error: '+e.message}finally{btn.disabled=false}}
render();
loadPersistentWorkspace();
</script>
</body>
</html>`;

function requestedLeadCount(question){const q=String(question||'');const m1=q.match(/\btop\s+(\d{1,2})\b/i);if(m1)return Number(m1[1]);const m2=q.match(/\bwhich\s+(\d{1,2})\s+leads?\b/i);if(m2)return Number(m2[1]);const m3=q.match(/\b(\d{1,2})\s+leads?\s+should\b/i);if(m3)return Number(m3[1]);return 0}
function wantsTodayPlan(question){return /\b(today|today's|todays|action plan|plan for today)\b/i.test(String(question||''))}
function wantsStaleLeads(question){return /\b(stale|getting old|older leads?|aging leads?|need attention)\b/i.test(String(question||''))}
function wantsSingleStalest(question){return /\b(stalest|oldest lead|most stale|most overdue)\b/i.test(String(question||''))}
function normalizeDays(value){if(value===null||value===undefined||value==='')return null;const n=Number(value);return !Number.isFinite(n)||n<0?null:n}
function normalizeActionStatusServer(s){const x=String(s||'').trim().toLowerCase();if(x==='contacted')return 'Contacted';if(x==='won'||x==='recovered'||x==='closed won')return 'Won';if(x==='lost'||x==='closed lost')return 'Lost';return 'Not contacted'}
function normalizeLead(x){return{name:String(x.name||'').slice(0,100),service:String(x.service||'').slice(0,100),value:Number(x.value)||0,status:String(x.status||'').slice(0,100),days:normalizeDays(x.days),last:String(x.last||'').slice(0,150),priority:String(x.priority||'').slice(0,20),actionStatus:normalizeActionStatusServer(x.actionStatus)}}
function serverHasKnownDays(l){return Number.isFinite(l.days)}
function isClosedServer(l){return l.actionStatus==='Won'||l.actionStatus==='Lost'}
function leadScoreServer(l){const p={High:30,Medium:20,Low:10}[l.priority]||0;const s=(l.status||'').toLowerCase();let intent=0;if(s.includes('callback'))intent=12;else if(s.includes('estimate'))intent=10;else if(s.includes('quote'))intent=9;else if(s.includes('missed'))intent=7;else if(s.includes('no response'))intent=5;else if(s.includes('unbooked'))intent=4;else if(s.includes('old customer'))intent=2;let recency=0;if(serverHasKnownDays(l)){if(l.days<=3)recency=8;else if(l.days<=7)recency=6;else if(l.days<=14)recency=4;else if(l.days<=30)recency=2}const value=Math.min(30,Math.max(0,Number(l.value)||0)/250);const actionAdjustment=l.actionStatus==='Contacted'?-2:isClosedServer(l)?-100:0;return Number(p)+Number(intent)+Number(recency)+Number(value)+actionAdjustment}
function activeLeads(leads){return leads.filter(l=>!isClosedServer(l))}
function rankLeads(leads){return [...leads].sort((a,b)=>leadScoreServer(b)-leadScoreServer(a)||(b.value||0)-(a.value||0))}
function reasonForServer(l){const bits=[];if(l.priority)bits.push(l.priority+' priority');if(l.value>0)bits.push('$'+Math.round(l.value).toLocaleString()+' potential value');bits.push('action status: '+l.actionStatus);const s=(l.status||'').toLowerCase();if(s.includes('callback'))bits.push('the customer requested a callback');else if(s.includes('estimate'))bits.push('an estimate was already sent');else if(s.includes('quote'))bits.push('the customer requested a quote');else if(s.includes('missed'))bits.push('there is a missed inbound opportunity');else if(s.includes('no response'))bits.push('the lead has not responded yet');else if(s.includes('unbooked'))bits.push('the inquiry is still unbooked');else if(s.includes('old customer'))bits.push('existing customer re-engagement opportunity');if(serverHasKnownDays(l)&&l.days>0)bits.push(l.days+' days since the recorded activity');if(!serverHasKnownDays(l))bits.push('age/recency was not provided');return bits.join('; ')+'.'}
function safeActionForServer(l){if(l.actionStatus==='Won')return 'No recovery follow-up needed. This lead is marked Won.';if(l.actionStatus==='Lost')return 'No recovery follow-up recommended. This lead is marked Lost.';const s=(l.status||'').toLowerCase();const last=(l.last||'').trim();const agePhrase=serverHasKnownDays(l)&&l.days>0?' from '+l.days+' days ago':'';if(s.includes('callback'))return 'Follow up on the callback request'+agePhrase+'.';if(s.includes('estimate'))return 'Follow up on the existing estimate'+agePhrase+'.';if(s.includes('quote'))return 'Follow up on the quote request'+agePhrase+'.';if(s.includes('missed'))return 'Follow up on the missed inbound contact'+agePhrase+'.';if(s.includes('no response'))return 'Follow up on the unanswered lead'+(last?' regarding: '+last:'')+'.';if(s.includes('unbooked'))return 'Follow up on the unbooked inquiry'+(last?' regarding: '+last:'')+'.';if(s.includes('old customer'))return 'Re-engage this existing customer'+(last?' regarding: '+last:'')+'.';if(last)return 'Follow up based on the recorded activity: '+last+'.';return 'Review this lead and follow up using the recorded information.'}
function exactLeadAnswer(leads,n){const active=rankLeads(activeLeads(leads));if(!active.length)return 'There are no active leads to prioritize because all uploaded leads are marked Won or Lost.';return active.slice(0,Math.min(n,active.length)).map((l,i)=>(i+1)+'. '+l.name+' — $'+Math.round(l.value).toLocaleString()+' — '+l.actionStatus+' — Reason: '+reasonForServer(l)).join('\n')}
function verifiedSummary(leads){const total=leads.reduce((s,l)=>s+(Number(l.value)||0),0);const highs=leads.filter(l=>l.priority==='High');const active=activeLeads(leads);const counts={notContacted:0,contacted:0,won:0,lost:0,wonValue:0};for(const l of leads){if(l.actionStatus==='Contacted')counts.contacted++;else if(l.actionStatus==='Won'){counts.won++;counts.wonValue+=Number(l.value)||0}else if(l.actionStatus==='Lost')counts.lost++;else counts.notContacted++}return{leadCount:leads.length,totalValue:total,highCount:highs.length,highValue:highs.reduce((s,l)=>s+(Number(l.value)||0),0),activeCount:active.length,activePotentialValue:active.reduce((s,l)=>s+(Number(l.value)||0),0),...counts}}
function todayPlanAnswer(leads,businessName){const facts=verifiedSummary(leads);const ranked=rankLeads(activeLeads(leads));const priority=ranked.filter(l=>l.priority==='High').slice(0,6);const fallback=priority.length?priority:ranked.slice(0,Math.min(5,ranked.length));const lines=['Aureon Revenue Radar — Verified Action Plan'];if(businessName)lines.push('Account: '+businessName);lines.push('','Verified summary','Total uploaded potential value: $'+Math.round(facts.totalValue).toLocaleString()+' across '+facts.leadCount+' leads.','Active recovery potential: $'+Math.round(facts.activePotentialValue).toLocaleString()+' across '+facts.activeCount+' active leads.','Action progress: '+facts.notContacted+' not contacted, '+facts.contacted+' contacted, '+facts.won+' won, '+facts.lost+' lost.','Won potential value: $'+Math.round(facts.wonValue).toLocaleString()+'.','','Priority actions for today');if(!fallback.length)lines.push('No active recovery leads remain.');fallback.forEach((l,i)=>lines.push((i+1)+'. '+l.name+' — $'+Math.round(l.value).toLocaleString()+' — '+l.actionStatus+' — '+safeActionForServer(l)));lines.push('','These figures and actions are generated from the uploaded CSV and current Aureon action statuses.');return lines.join('\n')}
function staleLeadsAnswer(leads){const stale=activeLeads(leads).filter(l=>serverHasKnownDays(l)&&l.days>=7&&!String(l.status||'').toLowerCase().includes('old customer')).sort((a,b)=>b.days-a.days||leadScoreServer(b)-leadScoreServer(a));if(!stale.length)return 'Aureon cannot identify any stale active leads from the current data. If age information is missing, add a Days/Age field and try again.';return['Aureon — Stale active leads needing attention','',...stale.slice(0,10).map((l,i)=>(i+1)+'. '+l.name+' — '+l.days+' days — $'+Math.round(l.value).toLocaleString()+' — '+l.actionStatus+' — '+safeActionForServer(l))].join('\n')}
function stalestLeadAnswer(leads){const known=activeLeads(leads).filter(serverHasKnownDays);if(!known.length)return 'I can’t determine which active lead is the stalest because the current data does not include age or last-activity timing for any active lead. Add a Days/Age field and Aureon can identify stale opportunities.';const maxDays=Math.max(...known.map(l=>l.days));const tied=known.filter(l=>l.days===maxDays).sort((a,b)=>leadScoreServer(b)-leadScoreServer(a));if(tied.length===1){const l=tied[0];return l.name+' is the stalest active lead at '+l.days+' days since the recorded activity. Current action status: '+l.actionStatus+'. Recommended next action: '+safeActionForServer(l)}return 'The stalest active leads are tied at '+maxDays+' days: '+tied.map(l=>l.name).join(', ')+'.'}
function factsPacket(leads,businessName){const s=verifiedSummary(leads);return{businessName:businessName||'Not provided',verifiedSummary:{leadCount:s.leadCount,totalPotentialValue:s.totalValue,highPriorityCount:s.highCount,highPriorityPotentialValue:s.highValue,activeLeadCount:s.activeCount,activePotentialValue:s.activePotentialValue,notContactedCount:s.notContacted,contactedCount:s.contacted,wonCount:s.won,lostCount:s.lost,wonPotentialValue:s.wonValue},leads:leads.map(l=>({name:l.name,service:l.service,value:l.value,status:l.status,days:serverHasKnownDays(l)?l.days:null,lastActivity:l.last,priority:l.priority,actionStatus:l.actionStatus,aureonScore:isClosedServer(l)?'Closed':Math.round(leadScoreServer(l)),whyRanked:reasonForServer(l),safeSuggestedAction:safeActionForServer(l)}))}}
function cleanCustomerAnswer(text){return String(text||'').replace(/\bageKnown\b/gi,'age information').replace(/\bnull\b/gi,'not provided').replace(/\bundefined\b/gi,'not provided').replace(/VERIFIED FACT PACKET/gi,'uploaded lead data').trim()}
function serverLeadKey(businessName,l){return [businessName,l.name,l.service].map(x=>String(x||'').trim().toLowerCase()).join('||').slice(0,500)}
async function callGemini(apiKey,prompt){const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:1600,temperature:0.1,thinkingConfig:{thinkingLevel:'minimal'}}})});const data=await r.json();if(!r.ok)throw new Error(data?.error?.message||'Gemini request failed.');return cleanCustomerAnswer(data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim()||'Aureon received no answer.')}

function securityHeaders(){return{'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:"}}
function htmlResponse(body,status=200){return new Response(body,{status,headers:{...securityHeaders(),'content-type':'text/html;charset=UTF-8'}})}
function getCookie(request,name){const raw=request.headers.get('Cookie')||'';for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;const k=part.slice(0,i).trim();if(k===name)return decodeURIComponent(part.slice(i+1).trim())}return ''}
async function hmacHex(secret,message){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)));return Array.from(sig,b=>b.toString(16).padStart(2,'0')).join('')}
function hexToBytes(hex){if(!/^[0-9a-f]+$/i.test(hex)||hex.length%2)return null;const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out}
function constantTimeEqual(a,b){if(a.length!==b.length)return false;if(typeof crypto.subtle.timingSafeEqual==='function')return crypto.subtle.timingSafeEqual(a,b);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0}
async function safeStringEqual(a,b){const enc=new TextEncoder();const da=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(a))));const db=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(b))));return constantTimeEqual(da,db)}
async function createSessionToken(secret){const exp=Date.now()+SESSION_TTL_SECONDS*1000;const nonce=crypto.randomUUID();const payload=exp+'.'+nonce;const sig=await hmacHex(secret,payload);return payload+'.'+sig}
async function verifySessionToken(token,secret){if(!token||!secret)return false;const parts=String(token).split('.');if(parts.length!==3)return false;const exp=Number(parts[0]);const nonce=parts[1];const provided=hexToBytes(parts[2]);if(!Number.isFinite(exp)||exp<=Date.now()||!nonce||!provided)return false;const expected=hexToBytes(await hmacHex(secret,parts[0]+'.'+nonce));return !!expected&&constantTimeEqual(provided,expected)}
async function isAuthenticated(request,env){if(!env.AUREON_SESSION_SECRET)return false;return verifySessionToken(getCookie(request,SESSION_COOKIE),env.AUREON_SESSION_SECRET)}
function sessionCookie(token){return SESSION_COOKIE+'='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+SESSION_TTL_SECONDS}
function clearSessionCookie(){return SESSION_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}
function unauthorizedJson(){return Response.json({error:'Owner session expired. Sign in again.'},{status:401,headers:{'cache-control':'no-store'}})}

export default{
async fetch(request,env){
const url=new URL(request.url);

// Service-to-service ingestion is disabled unless explicitly configured.
// This endpoint uses a dedicated table; it never calls the destructive bulk-import route.
if(request.method==='POST'&&url.pathname==='/api/integrations/leads'){
  if(!env.AUREON_DB||!env.AUREON_WEBHOOK_SECRET||!env.AUREON_WEBHOOK_BUSINESS_ID){
    return Response.json({error:'Integration is not configured.'},{status:503});
  }
  const timestamp=request.headers.get('x-aureon-timestamp')||'';
  const signature=request.headers.get('x-aureon-signature')||'';
  const requestId=request.headers.get('x-aureon-request-id')||'';
  if(!/^[a-zA-Z0-9_-]{16,128}$/.test(requestId))return Response.json({error:'Invalid webhook request ID.'},{status:400});
  if(!webhookTimestampValid(timestamp))return Response.json({error:'Invalid webhook timestamp.'},{status:401});
  let rawBody;
  try{
    if(Number(request.headers.get('content-length')||0)>16384)return Response.json({error:'Payload too large.'},{status:413});
    rawBody=await request.text();
    if(rawBody.length>16384)return Response.json({error:'Payload too large.'},{status:413});
  }catch{return Response.json({error:'Invalid request.'},{status:400})}
  if(!(await verifyWebhookSignature(env.AUREON_WEBHOOK_SECRET,timestamp+'.'+requestId,rawBody,signature))){
    return Response.json({error:'Invalid webhook signature.'},{status:401});
  }
  let lead;
  try{lead=normalizeIncomingLead(JSON.parse(rawBody))}
  catch{return Response.json({error:'Invalid lead payload.'},{status:400})}
  // Bind webhook credentials to one configured business; reject cross-account writes.
  if(lead.businessId!==env.AUREON_WEBHOOK_BUSINESS_ID){
    return Response.json({error:'Business is not authorized.'},{status:403});
  }
  try{
    // A unique nonce and the upsert are committed in the same D1 batch transaction.
    await env.AUREON_DB.batch([
      env.AUREON_DB.prepare('INSERT INTO integration_webhook_nonces (business_id,request_id) VALUES (?1,?2)').bind(lead.businessId,requestId),
      env.AUREON_DB.prepare(
        'INSERT INTO integration_leads (business_id,external_id,lead_name,service,source,lead_status,lead_value) VALUES (?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(business_id,external_id) DO UPDATE SET lead_name=excluded.lead_name,service=excluded.service,source=excluded.source,lead_status=excluded.lead_status,lead_value=excluded.lead_value,updated_at=CURRENT_TIMESTAMP'
      ).bind(lead.businessId,lead.externalId,lead.name,lead.service,lead.source,lead.status,lead.value)
    ]);
    return Response.json({ok:true,identity:lead.businessId+':'+lead.externalId},{status:200,headers:{'cache-control':'no-store'}});
  }catch{
    return Response.json({error:'Lead could not be stored.'},{status:500});
  }
}

if(request.method==='POST'&&url.pathname==='/api/login'){
  if(!env.AUREON_OWNER_PASSWORD||!env.AUREON_SESSION_SECRET)return Response.json({error:'V0.8 owner security secrets are not configured.'},{status:503});
  let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
  const password=String(body?.password||'');
  if(!password||!(await safeStringEqual(password,env.AUREON_OWNER_PASSWORD)))return Response.json({error:'Incorrect owner password.'},{status:401,headers:{'cache-control':'no-store'}});
  const token=await createSessionToken(env.AUREON_SESSION_SECRET);
  return Response.json({ok:true},{headers:{'set-cookie':sessionCookie(token),'cache-control':'no-store'}});
}

if(request.method==='POST'&&url.pathname==='/api/logout'){
  return Response.json({ok:true},{headers:{'set-cookie':clearSessionCookie(),'cache-control':'no-store'}});
}

if(request.method==='GET'&&url.pathname==='/'){
  if(!env.AUREON_OWNER_PASSWORD||!env.AUREON_SESSION_SECRET)return htmlResponse('<!doctype html><meta charset="utf-8"><title>Aureon setup</title><body style="font-family:Arial;background:#0b1020;color:white;padding:30px"><h1>Aureon V0.9 setup incomplete</h1><p>Add AUREON_OWNER_PASSWORD and AUREON_SESSION_SECRET as Cloudflare Worker secrets, then reload.</p></body>',503);
  return (await isAuthenticated(request,env))?htmlResponse(html):htmlResponse(loginHtml);
}

if(url.pathname.startsWith('/api/')&&url.pathname!=='/api/login'&&url.pathname!=='/api/logout'){
  if(!(await isAuthenticated(request,env)))return unauthorizedJson();
}

if(request.method==='GET'&&url.pathname==='/api/leads'){
  if(!env.AUREON_DB)return Response.json({error:'Aureon D1 database is not connected.'},{status:503});
  let businessName=String(url.searchParams.get('businessName')||'').trim().slice(0,80);
  try{
    if(!businessName){const latest=await env.AUREON_DB.prepare('SELECT business_name FROM leads ORDER BY updated_at DESC LIMIT 1').first();businessName=String(latest?.business_name||'').trim().slice(0,80)}
    if(!businessName)return Response.json({businessName:'',leads:[]});
    const result=await env.AUREON_DB.prepare("SELECT l.lead_key,l.business_name,l.lead_name,l.service,l.lead_value,l.lead_status,l.days,l.last_activity,l.priority,COALESCE(a.action_status,'Not contacted') AS action_status FROM leads l LEFT JOIN lead_actions a ON a.lead_key=l.lead_key WHERE lower(l.business_name)=lower(?1) ORDER BY l.updated_at DESC,l.lead_name ASC LIMIT 250").bind(businessName).run();
    return Response.json({businessName,leads:result.results||[]});
  }catch(err){return Response.json({error:'Could not load the persistent lead workspace: '+err.message},{status:500})}
}

if(request.method==='POST'&&url.pathname==='/api/leads/import'){
  if(!env.AUREON_DB)return Response.json({error:'Aureon D1 database is not connected.'},{status:503});
  let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
  const businessName=String(body?.businessName||'').trim().slice(0,80);
  const incoming=Array.isArray(body?.leads)?body.leads.slice(0,250).map(normalizeLead):[];
  if(!businessName)return Response.json({error:'Business name is required to save a persistent workspace.'},{status:400});
  if(!incoming.length)return Response.json({error:'No lead data was supplied.'},{status:400});
  const unique=new Map();
  for(const lead of incoming){if(!lead.name)continue;unique.set(serverLeadKey(businessName,lead),lead)}
  const items=[...unique.entries()];
  if(!items.length)return Response.json({error:'No usable leads were supplied.'},{status:400});
  try{
    const statements=[env.AUREON_DB.prepare('DELETE FROM leads WHERE lower(business_name)=lower(?1)').bind(businessName)];
    for(let i=0;i<items.length;i+=10){
      const chunk=items.slice(i,i+10);const values=[];const groups=[];let p=1;
      for(const [key,lead] of chunk){groups.push('(?'+p+',?'+(p+1)+',?'+(p+2)+',?'+(p+3)+',?'+(p+4)+',?'+(p+5)+',?'+(p+6)+',?'+(p+7)+',?'+(p+8)+',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)');values.push(key,businessName,lead.name,lead.service,lead.value,lead.status,serverHasKnownDays(lead)?lead.days:null,lead.last,lead.priority);p+=9}
      statements.push(env.AUREON_DB.prepare('INSERT INTO leads (lead_key,business_name,lead_name,service,lead_value,lead_status,days,last_activity,priority,created_at,updated_at) VALUES '+groups.join(',')).bind(...values));
    }
    await env.AUREON_DB.batch(statements);
    return Response.json({ok:true,businessName,saved:items.length});
  }catch(err){return Response.json({error:'Could not save the persistent lead workspace: '+err.message},{status:500})}
}

if(request.method==='GET'&&url.pathname==='/api/actions'){
  if(!env.AUREON_DB)return Response.json({error:'Aureon D1 database is not connected.'},{status:503});
  const businessName=String(url.searchParams.get('businessName')||'').trim().slice(0,80);if(!businessName)return Response.json({actions:[]});
  try{const result=await env.AUREON_DB.prepare('SELECT lead_key, action_status FROM lead_actions WHERE lower(business_name)=lower(?1)').bind(businessName).run();return Response.json({actions:result.results||[]})}catch(err){return Response.json({error:'Could not load saved lead actions: '+err.message},{status:500})}
}

if(request.method==='POST'&&url.pathname==='/api/action'){
  if(!env.AUREON_DB)return Response.json({error:'Aureon D1 database is not connected.'},{status:503});
  let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
  const leadKey=String(body?.leadKey||'').trim().slice(0,500);const businessName=String(body?.businessName||'').trim().slice(0,80);const leadName=String(body?.lead?.name||'').trim().slice(0,100);const service=String(body?.lead?.service||'').trim().slice(0,100);const leadValue=Number(body?.lead?.value)||0;const actionStatus=normalizeActionStatusServer(body?.actionStatus);
  if(!leadKey||!businessName||!leadName)return Response.json({error:'Business name and lead identity are required for permanent saving.'},{status:400});
  try{await env.AUREON_DB.prepare('INSERT INTO lead_actions (lead_key,business_name,lead_name,service,lead_value,action_status,updated_at) VALUES (?1,?2,?3,?4,?5,?6,CURRENT_TIMESTAMP) ON CONFLICT(lead_key) DO UPDATE SET business_name=excluded.business_name,lead_name=excluded.lead_name,service=excluded.service,lead_value=excluded.lead_value,action_status=excluded.action_status,updated_at=CURRENT_TIMESTAMP').bind(leadKey,businessName,leadName,service,leadValue,actionStatus).run();return Response.json({ok:true,actionStatus})}catch(err){return Response.json({error:'Could not save lead action: '+err.message},{status:500})}
}

if(request.method==='POST'&&url.pathname==='/api/ask'){
  let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
  const question=String(body?.question||'').trim();const businessName=String(body?.businessName||'').slice(0,80);const leads=Array.isArray(body?.leads)?body.leads.slice(0,250).map(normalizeLead):[];
  if(!question)return Response.json({error:'Please ask a question.'},{status:400});if(!leads.length)return Response.json({error:'No lead data was supplied.'},{status:400});
  const wanted=requestedLeadCount(question);if(wanted>0)return Response.json({answer:exactLeadAnswer(leads,wanted),mode:'aureon-ranking-engine'});if(wantsTodayPlan(question))return Response.json({answer:todayPlanAnswer(leads,businessName),mode:'aureon-accuracy-engine'});if(wantsSingleStalest(question))return Response.json({answer:stalestLeadAnswer(leads),mode:'aureon-accuracy-engine'});if(wantsStaleLeads(question))return Response.json({answer:staleLeadsAnswer(leads),mode:'aureon-accuracy-engine'});
  if(!env.GEMINI_API_KEY)return Response.json({error:'Gemini API key is not connected.'},{status:503});
  const packet=factsPacket(leads,businessName);
  const prompt='You are Aureon Revenue Radar, an AI analysis assistant for a service business.\n\nUse only the uploaded lead data below.\n\nCUSTOMER-FACING RULES:\n- Never expose internal variable names, JSON field names, code terms, schema names, or words such as null, undefined, packet, object, array, or field flag.\n- Treat every number in verifiedSummary as final.\n- Use actionStatus exactly as supplied. Not contacted means no action has been recorded yet. Contacted means outreach has been recorded. Won and Lost are closed statuses.\n- Do not recommend recovery follow-up for Won or Lost leads unless the business owner explicitly asks about them.\n- For Won or Lost leads, the Aureon score is closed and should not be treated as an active ranking score.\n- Missing days means age/recency is unknown; never treat it as 0 days or activity today.\n- Never invent a time of day, deadline, communication channel, customer preference, conversation, phone number, email address, or event that is not explicitly present.\n- When suggesting an action for a lead, stay within the safeSuggestedAction provided for that lead.\n- Never call potential revenue guaranteed revenue.\n- If the data does not support an answer, explain what is missing in ordinary business language.\n- Keep the response practical, concise, and customer-ready.\n- Use plain text only.\n\nUPLOADED LEAD DATA:\n\n'+JSON.stringify(packet)+'\n\nBusiness owner question:\n\n'+question;
  try{return Response.json({answer:await callGemini(env.GEMINI_API_KEY,prompt),mode:'gemini-grounded'})}catch(err){return Response.json({error:'Aureon could not reach Gemini: '+err.message},{status:502})}
}

return new Response('Not found',{status:404,headers:securityHeaders()});
}
};
