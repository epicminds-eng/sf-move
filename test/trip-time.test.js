/* SF Move — trip timing assertions.
 *
 *   NODE_PATH=$(npm root -g) node test/trip-time.test.js
 *
 * The drive crosses four time zones and every stamp is stored as a zone-less wall clock, so the
 * span between two stamps is only right if each one is read in the zone it was taken in. These
 * assertions drive the app's OWN dayStats() in a real browser rather than re-implementing it, and
 * every expected number is derived here from the two stamp strings the test itself sets — nothing
 * that also lives in index.html is retyped.
 */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const EXE=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium';

let FAIL=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m);if(!c)FAIL++;};
/* what the old zone-blind maths would have said: the two wall clocks subtracted as if one zone */
const naive=(a,b)=>(Date.parse(b+'Z')-Date.parse(a+'Z'))/60000;
const hm=m=>Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';

(async()=>{
const b=await chromium.launch({executablePath:EXE});
const p=await b.newPage();
const errs=[];
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
await p.goto(URL);await p.waitForTimeout(900);

/* the zones the trip actually crosses, read off the app's own STOPS table */
const zones=await p.evaluate(()=>STOPS.map(s=>s.id+'='+(s.tz||'?')));
ok(zones.every(z=>!/=\?$/.test(z)), `every stop carries an IANA zone (${zones.join(' ')})`);

/* --- helper: set both stamps for a day, then ask the app what the day was --- */
const day=(stopId,d,rolled,arrived)=>p.evaluate(({stopId,d,rolled,arrived})=>{
  state.trip.rolled[stopId]=rolled;state.trip.arrivedAt[stopId]=arrived;state.trip.arrived[stopId]=true;
  const r=dayStats(d);
  return {d2d:r.d2d,span:r.span,drive:r.drive,complete:r.complete,
    rolledTz:r.rolledTz,tz:r.tz,
    shown:(r.rolled?fmtTime(r.rolled):'')+' → '+(r.arrived?fmtTime(r.arrived):'')};
},{stopId,d,rolled,arrived});

/* ---------- Day 3: Amarillo (CDT, UTC-5) → Holbrook (MST, UTC-7) ---------- */
{
  const R='2026-09-08T08:00',A='2026-09-08T16:30';
  const r=await day('holbrook',3,R,A);
  ok(r.rolledTz==='America/Chicago'&&r.tz==='America/Phoenix',
     `Day 3 reads each stamp in its own zone (rolled ${r.rolledTz} → arrived ${r.tz})`);
  ok(r.d2d===naive(R,A)+120, `Day 3 door to door is ${hm(r.d2d)} — the wall clocks differ by ${hm(naive(R,A))}, and the zone change adds the missing two hours`);
  ok(hm(r.d2d)==='10h 30m', `Day 3 door to door reads 10h 30m, not ${hm(naive(R,A))} (${hm(r.d2d)})`);
  ok(r.shown==='8:00 AM → 4:30 PM', `Day 3 still SHOWS the stamps as written (${r.shown})`);
}

/* ---------- Day 5: Mom's (MST) → Coalinga (PDT) — same offset in September, so no shift ---------- */
{
  const R='2026-09-10T07:15',A='2026-09-10T14:45';
  const r=await day('coalinga',5,R,A);
  ok(r.rolledTz==='America/Phoenix'&&r.tz==='America/Los_Angeles',
     `Day 5 crosses Phoenix → Los Angeles (${r.rolledTz} → ${r.tz})`);
  ok(r.d2d===naive(R,A), `Day 5 door to door is unshifted at ${hm(r.d2d)} — Arizona does not keep DST, so in September it already reads Pacific time`);
  ok(r.shown==='7:15 AM → 2:45 PM', `Day 5 still SHOWS the stamps as written (${r.shown})`);
}

/* ---------- the primitive itself ---------- */
{
  const z=await p.evaluate(()=>({
    chi:zonedToEpoch('2026-09-08T08:00','America/Chicago'),
    phx:zonedToEpoch('2026-09-08T08:00','America/Phoenix'),
    den:zonedToEpoch('2026-09-08T08:00','America/Denver'),
    la:zonedToEpoch('2026-09-08T08:00','America/Los_Angeles'),
    winter:zonedToEpoch('2026-12-08T08:00','America/Los_Angeles'),
    summer:zonedToEpoch('2026-07-08T08:00','America/Los_Angeles'),
    charge:CHARGES.filter(c=>c.id==='chg-019').map(c=>({tz:chgTz(c),ts:chgTs(c),wall:chgWall(c)}))[0],
    tx:chgTz(CHARGES.filter(c=>c.id==='chg-012')[0]),
    nm:chgTz(CHARGES.filter(c=>c.id==='chg-016')[0]),
    ca:chgTz(CHARGES.filter(c=>c.id==='chg-029')[0]),   /* chg-oasis (planned) was retired in v109, fulfilled by chg-029 at the same Lost Hills, CA address */
    il:chgTz(CHARGES.filter(c=>c.id==='chg-001')[0])}));
  const H=3600000;
  ok(z.phx-z.chi===2*H, `Phoenix is two hours behind Chicago on a September morning (${(z.phx-z.chi)/H}h)`);
  ok(z.den-z.chi===1*H, `Denver is one hour behind Chicago (${(z.den-z.chi)/H}h)`);
  ok(z.la-z.phx===0, `Los Angeles and Phoenix are the same clock in September (${(z.la-z.phx)/H}h)`);
  ok(z.winter-z.summer!==0&&(z.winter%H)-(z.summer%H)===0, `the same wall clock is a different instant in PST and PDT — the solve follows DST, it is not a fixed table`);
  ok(z.tx==='America/Chicago'&&z.nm==='America/Denver'&&z.ca==='America/Los_Angeles'&&z.il==='America/Chicago',
     `a charge takes its zone from the state in its address (TX ${z.tx} · NM ${z.nm} · CA ${z.ca} · IL ${z.il})`);
  ok(z.charge.tz==='America/Phoenix'&&z.charge.ts!==null&&!isNaN(z.charge.ts),
     `an Arizona charge is an instant in Phoenix (${z.charge.tz})`);
}

/* ---------- nothing the user reads moved ---------- */
{
  const shown=await p.evaluate(()=>{
    const c=CHARGES.filter(x=>x.id==='chg-022')[0];
    return {wall:fmtTime(chgWall(c)),stored:c.time};});
  ok(shown.wall==='1:51 PM'&&shown.stored==='13:51', `a charge still displays its station-local clock (${shown.stored} → ${shown.wall})`);
}

/* ---------- SF arrival: the trip is complete, and every "done" reads from the one stamp ----------
   Two stores: a fresh install, and a device that had already tapped Arrived at SF at a different time.
   Both must end on arrivedAt.sf === 2026-09-11T09:11; nothing here retypes a mileage — TOTAL_MI is read. */
{
  const SF='2026-09-11T09:11';
  const TAPPED={trip:{departDate:'2026-09-06',
    arrived:{strobert:true,amarillo:true,holbrook:true,moms:true,coalinga:true,sf:true},
    arrivedAt:{strobert:'2026-09-06T17:49',amarillo:'2026-09-07T19:30',holbrook:'2026-09-08T16:30',moms:'2026-09-09T12:45',coalinga:'2026-09-10T15:10',sf:'2026-09-11T10:05'},
    rolled:{strobert:'2026-09-06T08:30',amarillo:'2026-09-07T07:19',holbrook:'2026-09-08T07:05',moms:'2026-09-09T08:15',coalinga:'2026-09-10T07:30',sf:'2026-09-11T06:40'},
    dateMigratedV1:true,dateMigratedV2:true,day2AmarilloV1:true,day3WinslowV1:true,day3HolbrookV1:true,day5CoalingaV1:true,
    arrivedAtV1:true,rolledV1:true,day2ArrivedV1:true,day3ArrivedV1:true,day1ArrivedFixV1:true},
    spend:{seededV1:true,entries:[]},disp:{},customTasks:{},custom:{},meta:{stamped:true,touched:{}}};
  for(const [tag,seed] of [['fresh install',null],['device that tapped Arrived at 10:05',TAPPED]]){
    console.log(`\n===== SF arrival — ${tag} =====`);
    for(const [w,h] of [[390,844],[1194,834]]){
      const c=await b.newContext({viewport:{width:w,height:h}});
      if(seed)await c.addInitScript(S=>{localStorage.setItem('sfMoveApp_v1',JSON.stringify(S));},seed);
      const q=await c.newPage();const e2=[];
      q.on('pageerror',e=>e2.push('pageerror: '+e.message));
      await q.goto(URL);await q.waitForTimeout(900);
      await q.click('#nav-trip');await q.waitForTimeout(700);
      const d=await q.evaluate(SF=>{
        const sf=STOPS[STOPS.length-1],r=dayStats(TRIP_DAYS),cur=tripDayNow(),F=todayFigures();
        const all=[];for(let d=1;d<=TRIP_DAYS;d++)all.push(dayStatus(d,cur));
        const card=[].slice.call(document.querySelectorAll('#tripStops .card, [data-stop="sf"]')).pop();
        const route=document.getElementById('tripStops')?document.getElementById('tripStops').innerText:'';
        return {id:sf.id,at:state.trip.arrivedAt.sf,flag:!!state.trip.sfArrivedV1,arr:!!state.trip.arrived.sf,
          arrivedT:r?r.arrivedT:null,want:zonedToEpoch(SF,sf.tz),rolled:state.trip.rolled.sf||null,d2d:r?r.d2d:null,complete:!!(r&&r.complete),
          statuses:all,logged:loggedMiles(),total:TOTAL_MI,loggedTxt:num(loggedMiles()),togo:F.togo,dpDone:F.dp.done,
          strip:(document.getElementById('tripStrip')||{}).innerText||'',
          routeArrived:/Arrived/.test(route)&&!/Upcoming|In progress/.test(route),
          hero:(document.querySelector('.tr-meta,.trbar')||{}).innerText||''};},SF);
      const t=`${tag} @ ${w}`;
      ok(d.at===SF&&d.flag&&d.arr, `${t}: arrivedAt.sf is ${d.at}, arrived, sfArrivedV1 flagged`);
      ok(d.arrivedT===d.want, `${t}: Day 6 arrival instant is 9:11 read in ${d.id}'s own zone`);
      if(d.rolled){const want=naive(d.rolled,SF);
        ok(d.d2d===want&&d.complete, `${t}: Day 6 door to door computed from 9:11 — ${hm(d.d2d)} from a ${d.rolled.slice(11)} roll`);}
      else ok(d.d2d===null, `${t}: no Day 6 roll stamp on a fresh install, so door to door stays "—" (not fabricated)`);
      ok(d.statuses.every(s=>s==='done'), `${t}: ${d.statuses.filter(s=>s==='done').length} of ${d.statuses.length} days read Done (${d.statuses.join(' ')})`);
      ok(d.logged===d.total&&d.loggedTxt==='2,556', `${t}: ${d.loggedTxt} mi logged = TOTAL_MI`);
      ok(d.togo===0&&d.dpDone&&/arrived/.test(d.strip)&&!/mi to go/.test(d.strip), `${t}: 0 mi to go — the strip reads "arrived"`);
      ok(d.routeArrived, `${t}: Your Route shows every stop Arrived, none Upcoming`);
      ok(e2.length===0, `${t}: no page errors${e2.length?' — '+e2[0]:''}`);
      if(process.env.SHOTS&&!seed){   /* verify pass only: the fresh store, Trip tab top */
        const v=await q.evaluate(()=>(document.querySelector('.appver').textContent.match(/v(\d+)/)||[])[1]);
        await q.screenshot({path:path.resolve(__dirname,'..','design','verify',`v${v}-arrived-${w}.png`)});
      }
      await c.close();
    }
  }
}

ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);
await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
