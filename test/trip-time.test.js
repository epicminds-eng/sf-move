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
    ca:chgTz(CHARGES.filter(c=>c.id==='chg-oasis')[0]),
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

ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);
await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
