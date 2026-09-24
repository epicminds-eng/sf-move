/* SF Move — Spend close-out.
 *
 *   NODE_PATH=$(npm root -g) node test/spend.test.js          (SHOTS=1 to also write design/verify shots)
 *
 * The trip is over. Six planned rows never got resolved on device and the UI cannot delete a seeded row,
 * so spendCloseoutV1 resolves them once: pet fees and tolls still planned become actuals at their planned
 * amount, Ship Sticks (never happened) goes, and a hand-entered "Watter" is renamed. seedSpend now seeds
 * that same end state, so a fresh install needs no migration at all.
 *
 * Two stores at 390 and 1194: (a) a fresh install; (b) a store in the shape of a real export — the six
 * planned rows as the old seed wrote them, one pet fee already confirmed by hand at a different amount,
 * and a "Watter" row. The expected delta in the actual total is derived from the fixture, never retyped.
 */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const EXE=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium';
const OUT=path.resolve(__dirname,'..','design','verify');

let FAIL=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m);if(!c)FAIL++;};
const r2=n=>Math.round(n*100)/100;

/* the six rows exactly as the pre-close-out seed wrote them, then what a device did to them */
const T=1757000000000;
const P=(id,amount,cat,note,day,stopId,x)=>Object.assign({id,amount,cat,note,day,stopId,ts:T,planned:true,billsLater:false},x||{});
const CONVERT=['seed-p2','seed-p3','seed-p5','seed-t1','seed-t2'];
const ENTRIES=[
  P('seed-p2',75,'kane','Pet fee · Home2 Suites',2,'amarillo'),
  P('seed-p3',60,'kane','Pet fee · Holbrook',3,'holbrook',{planned:false,ts:T+5e6}),   /* confirmed by hand at $60, not the $50 plan */
  P('seed-p5',50,'kane','Pet fee · Harris Ranch',5,'coalinga'),
  P('seed-t1',5,'tolls','Illinois Tollway (I-PASS)',1,'strobert',{billsLater:true}),
  P('seed-t2',12,'tolls','Oklahoma turnpikes (Will Rogers + Turner)',2,'amarillo',{billsLater:true}),
  P('seed-m0',240,'misc','Ship Sticks · 3 pieces',0,null),
  {id:'e'+(T+1e6),amount:18.72,cat:'misc',note:'Watter',day:0,stopId:null,ts:T+1e6,planned:false,billsLater:false}
];
const FLAGS={seededV1:true,day1PetV1:true,day1HotelV1:true,day2HotelV1:true,day3HotelV1:true,hotel5BookedV1:true,seedH3RetireV1:true,pl002CostFixV1:true};
const TRIP={departDate:'2026-09-06',arrived:{strobert:true,amarillo:true,holbrook:true,moms:true,coalinga:true,sf:true},
  arrivedAt:{strobert:'2026-09-06T17:49',amarillo:'2026-09-07T19:30',holbrook:'2026-09-08T16:30',sf:'2026-09-11T09:11'},
  rolled:{strobert:'2026-09-06T08:30'},
  dateMigratedV1:true,dateMigratedV2:true,day2AmarilloV1:true,day3WinslowV1:true,day3HolbrookV1:true,day5CoalingaV1:true,
  arrivedAtV1:true,rolledV1:true,day2ArrivedV1:true,day3ArrivedV1:true,day1ArrivedFixV1:true,sfArrivedV1:true};
const store=extra=>({trip:TRIP,spend:Object.assign({entries:JSON.parse(JSON.stringify(ENTRIES))},FLAGS,extra||{}),
  done:{'jh-key':true,'jh-suitcase1':true},disp:{},customTasks:{},custom:{},places:[],meta:{stamped:true,touched:{}}});
const REAL=store(),FROZEN=store({spendCloseoutV1:true});   /* FROZEN: the same device with the flag already consumed — the baseline for the delta */
const wantDelta=r2(ENTRIES.filter(e=>e.planned&&CONVERT.indexOf(e.id)>=0).reduce((a,e)=>a+e.amount,0));

const probe=()=>{
  const r2=n=>Math.round(n*100)/100;   /* runs in the page: nothing from the Node scope is visible here */
  const E=state.spend.entries,by=id=>E.filter(x=>x.id===id),t=spendTotals();
  const move=(document.getElementById('page-move')||{}).innerText||'',spend=(document.getElementById('page-spend')||{}).innerText||'';
  const joey=PHASES.find(ph=>ph.id==='joey');
  let exp=null;try{exp=JSON.parse(exportJSON());}catch(e){}
  return {flag:!!state.spend.spendCloseoutV1,
    planned:E.filter(x=>x.planned).map(x=>x.id),plTotal:r2(t.plHotelPet+t.plOther),soFar:r2(t.soFar),
    rows:Object.fromEntries(['seed-p2','seed-p3','seed-p5','seed-t1','seed-t2','seed-m0'].map(id=>[id,by(id).map(x=>({a:x.amount,p:x.planned,bl:x.billsLater,cat:x.cat,day:x.day,note:x.note}))])),
    water:E.filter(x=>x.amount===18.72).map(x=>({id:x.id,note:x.note,day:x.day})),
    dupes:E.length-new Set(E.map(x=>x.id)).size,
    shipMove:/Ship Sticks/i.test(move),shipSpend:/Ship Sticks/i.test(spend),shipStr:/shipsticks/i.test(document.documentElement.outerHTML),
    joeyN:joey?joey.items.length:0,joeyItems:joey?joey.items.map(x=>x.id):[],joeyShip:joey?joey.items.some(x=>/Ship Sticks/i.test(x.t+' '+x.d)):null,
    joeyDone:['jh-key','jh-suitcase1'].map(id=>!!state.done[id]),
    joeyRows:(()=>{const c=[].slice.call(document.querySelectorAll('#phaseGroups .card')).find(x=>x.querySelector('.sec-head .t').textContent==='Joey Handoff');return c?c.querySelectorAll('.check').length:-1;})(),
    plannedLabel:/\bPlanned\b/.test(spend),
    exp:exp&&exp.spend?{flag:!!exp.spend.spendCloseoutV1,planned:exp.spend.entries.filter(x=>x.planned).length,m0:exp.spend.entries.some(x=>x.id==='seed-m0'),
      water:exp.spend.entries.some(x=>x.note==='Water'&&x.amount===18.72),p3:(exp.spend.entries.find(x=>x.id==='seed-p3')||{}).amount,
      t1:(exp.spend.entries.find(x=>x.id==='seed-t1')||{})}:null,
    sig:JSON.stringify(E.slice().sort((a,b)=>a.id<b.id?-1:1))};};

(async()=>{
const b=await chromium.launch({executablePath:EXE});
const open=async(w,h,seed,tab)=>{
  const c=await b.newContext({viewport:{width:w,height:h}});
  if(seed)await c.addInitScript(S=>{localStorage.setItem('sfMoveApp_v1',JSON.stringify(S));},seed);
  const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto(URL);await p.waitForTimeout(900);
  await p.click('#nav-move');await p.waitForTimeout(300);   /* render Move once so its text can be searched */
  await p.click('#nav-spend');await p.waitForTimeout(500);
  return {c,p,errs};};

for(const [w,h] of [[390,844],[1194,834]]){
  /* ---------- (a) fresh install ---------- */
  console.log(`\n===== fresh install @ ${w}×${h} =====`);
  {
    const {c,p,errs}=await open(w,h,null);
    const d=await p.evaluate(probe);
    ok(d.planned.length===0&&d.plTotal===0, `Spend has zero planned rows (planned total $${d.plTotal})`);
    ok(CONVERT.every(id=>d.rows[id].length===1&&d.rows[id][0].p===false&&d.rows[id][0].bl===false), `pet fees and tolls seed as actuals (${CONVERT.map(id=>id+'=$'+d.rows[id][0].a).join(' ')})`);
    ok(d.rows['seed-m0'].length===0, `seed-m0 (Ship Sticks) does not seed`);
    ok(!d.shipMove&&!d.shipSpend&&!d.shipStr, `no Ship Sticks anywhere on Move or Spend, and no shipsticks link in the page`);
    ok(!d.joeyShip&&d.joeyN===d.joeyRows&&d.joeyRows>0, `Joey Handoff keeps its ${d.joeyN} non-Ship-Sticks items and renders all of them`);
    ok(!d.plannedLabel, `no row on Spend is captioned "Planned"`);
    ok(d.flag&&d.dupes===0, `spendCloseoutV1 flagged, no duplicate ids`);
    ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);
    await c.close();
  }
  /* ---------- (b) a device in the shape of a real export ---------- */
  console.log(`\n===== real export shape @ ${w}×${h} =====`);
  {
    const f=await open(w,h,FROZEN);const base=await f.p.evaluate(probe);await f.c.close();
    const {c,p,errs}=await open(w,h,REAL);
    const d=await p.evaluate(probe);
    ok(d.flag, `spendCloseoutV1 ran`);
    ok(d.rows['seed-p3'].length===1&&d.rows['seed-p3'][0].a===60&&d.rows['seed-p3'][0].p===false, `the hand-confirmed pet fee keeps its $${d.rows['seed-p3'][0].a}, not the plan`);
    for(const id of CONVERT.filter(x=>x!=='seed-p3')){const src=ENTRIES.find(e=>e.id===id),r=d.rows[id][0];
      ok(d.rows[id].length===1&&r&&r.a===src.amount&&r.p===false&&r.bl===false&&r.cat===src.cat&&r.day===src.day&&r.note===src.note,
         `${id} became an actual at its planned $${src.amount} — id, ${src.cat}, Day ${src.day} and label kept`);}
    ok(d.rows['seed-m0'].length===0, `seed-m0 is gone`);
    ok(d.water.length===1&&d.water[0].note==='Water'&&d.water[0].id===ENTRIES[6].id&&d.water[0].day===0, `"Watter" → "Water", same row (${d.water[0]&&d.water[0].id})`);
    ok(d.planned.length===0&&d.plTotal===0, `no planned rows remain`);
    ok(r2(d.soFar-base.soFar)===wantDelta, `actual total rose by exactly the converted rows: $${base.soFar} → $${d.soFar} (+$${r2(d.soFar-base.soFar)}, want +$${wantDelta})`);
    ok(d.exp&&d.exp.flag&&d.exp.planned===0&&!d.exp.m0&&d.exp.water&&d.exp.p3===60&&d.exp.t1.planned===false&&d.exp.t1.billsLater===false, `Export JSON round-trips all of it`);
    ok(!d.shipMove&&!d.shipSpend, `no Ship Sticks on Move or Spend`);
    ok(d.joeyDone.every(Boolean)&&d.joeyN===d.joeyRows, `Joey's other items keep their checked state (${d.joeyDone.filter(Boolean).length} still ticked) and all ${d.joeyN} render`);
    ok(!d.plannedLabel, `no row on Spend is captioned "Planned"`);
    ok(d.dupes===0, `no duplicate ids`);
    if(process.env.SHOTS){
      const ver=await p.evaluate(()=>(document.querySelector('.appver').textContent.match(/v(\d+)/)||[])[1]);
      await p.screenshot({path:path.join(OUT,`v${ver}-closeout-${w}.png`)});
    }
    /* reloading twice changes nothing */
    await p.reload();await p.waitForTimeout(900);await p.click('#nav-spend');await p.waitForTimeout(400);
    const r1=await p.evaluate(probe);
    await p.reload();await p.waitForTimeout(900);await p.click('#nav-spend');await p.waitForTimeout(400);
    const r2s=await p.evaluate(probe);
    ok(r1.sig===d.sig&&r2s.sig===d.sig&&r2s.soFar===d.soFar, `two reloads change nothing ($${r2s.soFar}, ${JSON.parse(r2s.sig).length} rows)`);
    ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);
    await c.close();
  }
}
await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
