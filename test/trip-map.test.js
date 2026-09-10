/* SF Move — Trip map framing, map popups, and the app-wide wording rules.
 *
 *   NODE_PATH=$(npm root -g) node test/trip-map.test.js
 *
 * The frame assertions compare the map's OWN reported frame (mapFrame(), the region actually on
 * screen in map units) against the app's own projected coordinates — no viewBox numbers are retyped.
 */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const EXE=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium';
const SECS=['overview','daily','charging','places','hotels','itinerary'];

let FAIL=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m);if(!c)FAIL++;};
const r2=n=>Math.round(n*100)/100;
const same=(a,b)=>a&&b&&['x','y','w','h'].every(k=>Math.abs(a[k]-b[k])<0.5);
const holds=(f,p,slack)=>p.x>=f.x-(slack||0)&&p.y>=f.y-(slack||0)&&p.x<=f.x+f.w+(slack||0)&&p.y<=f.y+f.h+(slack||0);
const box=f=>`${r2(f.x)},${r2(f.y)} ${r2(f.w)}×${r2(f.h)}`;

(async()=>{
const b=await chromium.launch({executablePath:EXE});
for(const [w,h] of [[393,852],[1194,834]]){
  console.log(`\n===== ${w}×${h} =====`);
  const c=await b.newContext({viewport:{width:w,height:h}});
  const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto(URL);await p.waitForTimeout(900);
  await p.click('#nav-trip');await p.waitForTimeout(700);

  const seg=async k=>{await p.evaluate(s=>setTripSeg(s),k);await p.waitForTimeout(900);};
  const frame=()=>p.evaluate(()=>mapFrame());
  const settle=async()=>{await p.waitForTimeout(800);};

  /* the Reset frame is the reference for "full route" */
  await p.evaluate(()=>resetMapZoom(false));await settle();
  const reset=await frame();

  /* ---------- 1. Overview, Charging, Itinerary and Hotels open on the full route ---------- */
  for(const s of ['overview','charging','itinerary','hotels']){
    await p.evaluate(()=>centerOn(120,120,3.2,0.5));await settle();   /* pan somewhere else first, so a pass means the switch re-framed */
    await seg(s);
    ok(same(await frame(),reset), `${w} ${s} frames the full route, identical to Reset (${box(await frame())} vs ${box(reset)})`);
  }

  /* ---------- 2. Daily frames the day's leg ---------- */
  await seg('daily');
  const dly=await p.evaluate(()=>{
    const d=frameDay(),st=stopForDay(d),k=STOPS.indexOf(st);
    return {d:d,f:mapFrame(),
      from:proj(STOPS[Math.max(0,k-1)].lat,STOPS[Math.max(0,k-1)].lng),to:proj(st.lat,st.lng),
      chg:CHARGES.filter(x=>!x.planned&&x.date&&x.lat&&dayForDate(parseYMD(x.date))===d).map(x=>proj(x.lat,x.lng)),
      names:[STOPS[Math.max(0,k-1)].short,st.short]};});
  ok(holds(dly.f,dly.from)&&holds(dly.f,dly.to),
     `${w} Daily holds both stops of Day ${dly.d} (${dly.names.join(' → ')}) in ${box(dly.f)}`);
  ok(dly.chg.every(q=>holds(dly.f,q)), `${w} and all ${dly.chg.length} of the day's chargers`);
  ok(dly.f.w<reset.w-0.5&&dly.f.h<reset.h-0.5, `${w} Daily is tighter than the full route (${r2(dly.f.w)} vs ${r2(reset.w)} wide)`);
  /* padded: neither stop sits on the edge */
  const edge=Math.min(dly.from.x-dly.f.x,dly.f.x+dly.f.w-dly.to.x,dly.to.x-dly.f.x,dly.f.x+dly.f.w-dly.from.x);
  ok(edge>1.5, `${w} Daily pads its leg — nearest stop is ${r2(edge)} units off the edge`);

  /* the day selector re-frames with it */
  const other=await p.evaluate(()=>{const d=frameDay(),n=d>1?d-1:d+1;
    document.querySelector('#trDaily [data-day="'+n+'"]').click();return n;});
  await settle();
  const df2=await p.evaluate(()=>({d:frameDay(),f:mapFrame(),to:proj(stopForDay(frameDay()).lat,stopForDay(frameDay()).lng)}));
  ok(df2.d===other&&holds(df2.f,df2.to)&&!same(df2.f,dly.f), `${w} picking Day ${other} re-frames onto its leg (${box(df2.f)})`);

  /* ---------- 3. Places frames that day's places ---------- */
  await seg('places');
  const plc=await p.evaluate(()=>{
    const d=frameDay();
    let pts=allPlaces().filter(x=>x.lat&&x.lng&&dayForDate(parseYMD(x.date))===d);
    const day=pts.length?d:null;
    if(!pts.length)pts=allPlaces().filter(x=>x.lat&&x.lng);
    return {day:day,f:mapFrame(),n:pts.length,pts:pts.map(x=>({n:x.name,...proj(x.lat,x.lng)}))};});
  ok(plc.n>0, `${w} Places has ${plc.n} place${plc.n===1?'':'s'} to frame${plc.day===null?' (the day marked none, so every place)':' (Day '+plc.day+')'}`);
  const out=plc.pts.filter(q=>!holds(plc.f,q));
  ok(out.length===0, `${w} every one of them is inside the frame ${box(plc.f)}${out.length?' — outside: '+out.map(q=>q.n).join(', '):''}`);
  const pad=Math.min(...plc.pts.map(q=>Math.min(q.x-plc.f.x,plc.f.x+plc.f.w-q.x,q.y-plc.f.y,plc.f.y+plc.f.h-q.y)));
  ok(pad>1.5, `${w} and padded, not sitting on an edge (${r2(pad)} units clear)`);

  /* ---------- 4. Daily → Overview restores the Reset frame ---------- */
  await seg('daily');const dback=await frame();
  await seg('overview');
  ok(!same(dback,reset)&&same(await frame(),reset), `${w} Daily → Overview restores the Reset frame`);

  /* ---------- layer toggles do NOT re-frame ---------- */
  await seg('daily');const beforeLayer=await frame();
  for(const m of ['chg','places','hotel']){await p.evaluate(k=>setMapMode(k),m);await settle();}
  ok(same(await frame(),beforeLayer), `${w} layer toggles change what is drawn, not the frame`);
  await p.evaluate(()=>setMapMode('route'));await settle();

  /* ---------- 5. nothing rendered contains a tilde ---------- */
  const tScan=await p.evaluate(secs=>{
    const hits=[];const seen={};
    const scan=where=>{const t=document.body.innerText||'';
      t.split('\n').forEach(l=>{if(l.indexOf('~')>=0&&!seen[l]){seen[l]=1;hits.push(where+': '+l.trim());}});};
    const pages=['move','sort','pack','trip','spend'];
    pages.forEach(pg=>{document.getElementById('nav-'+pg).click();
      if(pg==='trip'){secs.forEach(s=>{setTripSeg(s);scan('trip/'+s);});}else scan(pg);});
    document.getElementById('nav-trip').click();setTripSeg('overview');
    return hits;},SECS);
  ok(tScan.length===0, `${w} no rendered text contains "~"${tScan.length?' — '+tScan.slice(0,3).join(' | '):''}`);

  /* ---------- 6. no label announces that it is a link ---------- */
  const words=await p.evaluate(secs=>{
    const bad=[],seen={},re=/open in|link to|tap to|go to|\bview\b|\bclick\b/i;
    const scan=where=>{document.querySelectorAll('.page.active a, .page.active button, .page.active [role=button]').forEach(el=>{
      const t=(el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
      if(t&&re.test(t)&&!seen[t]){seen[t]=1;bad.push(where+': "'+t+'"');}});};
    ['move','sort','pack','trip','spend'].forEach(pg=>{document.getElementById('nav-'+pg).click();
      if(pg==='trip'){secs.forEach(s=>{setTripSeg(s);scan('trip/'+s);});}else scan(pg);});
    document.getElementById('nav-trip').click();setTripSeg('overview');
    return bad;},SECS);
  ok(words.length===0, `${w} no link or button announces that it is a link${words.length?' — '+words.slice(0,4).join(' | '):''}`);

  /* ---------- 7. every map popup is exactly two text lines + one chevron ---------- */
  const pops=[];
  for(const [mode,sec] of [['places','places'],['hotel','hotels'],['chg','charging'],['life','charging']]){
    await seg(sec);
    await p.evaluate(m=>{setMapMode(m);},mode);await p.waitForTimeout(600);
    const n=await p.evaluate(()=>document.querySelectorAll('#pinG [data-pin]').length);
    for(let i=0;i<Math.min(n,4);i++){
      const r=await p.evaluate(j=>{pinPopOpen(j);
        const el=document.getElementById('pinPop');if(!el||el.hidden)return null;
        const a=el.querySelector('a.pp'),t=el.querySelector('b'),m=el.querySelector('.pp-m'),ch=el.querySelectorAll('.pp-c');
        const lines=[t,m].filter(Boolean).map(x=>x.textContent.trim()).filter(Boolean);
        const oneLine=x=>{const lh=parseFloat(getComputedStyle(x).lineHeight)||parseFloat(getComputedStyle(x).fontSize)*1.2;
          return x.getBoundingClientRect().height<=lh*1.6;};
        return {mode:mapMode(),href:a?a.getAttribute('href'):null,lines:lines,
          blocks:el.querySelectorAll('b,.pp-m,.l,p,div').length,
          chev:ch.length,close:el.querySelectorAll('[data-close]').length,
          wraps:[t,m].filter(Boolean).filter(x=>!oneLine(x)).map(x=>x.textContent.trim()),
          whole:!!(a&&a.contains(t)&&a.contains(m)),
          w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)};},i);
      if(r)pops.push(r);
    }
    await p.evaluate(()=>pinPopClose());
  }
  ok(pops.length>=6, `${w} sampled ${pops.length} popups across place / hotel / charger / lifetime`);
  ok(pops.every(x=>x.lines.length===2), `${w} every popup has exactly two text lines${pops.filter(x=>x.lines.length!==2).map(x=>' — '+x.lines.join(' / ')).slice(0,2).join('')}`);
  ok(pops.every(x=>!x.wraps.length), `${w} neither line wraps${pops.flatMap(x=>x.wraps).slice(0,2).map(t=>' — "'+t+'"').join('')}`);
  ok(pops.every(x=>x.chev===1), `${w} exactly one chevron on each`);
  ok(pops.every(x=>x.close===0), `${w} no close button left inside the pill`);
  ok(pops.every(x=>x.whole&&/^https:\/\/maps\.apple\.com\//.test(x.href||'')), `${w} the whole pill is the Apple Maps link`);
  ok(pops.every(x=>x.w<=230&&x.h<=110), `${w} pill dimensions unchanged (widest ${Math.max(...pops.map(x=>x.w))}px, tallest ${Math.max(...pops.map(x=>x.h))}px)`);
  console.log('  popups: '+pops.map(x=>x.lines.join(' / ')).join('  |  '));

  /* ---------- Highlights opens on Trip ---------- */
  const hl=await p.evaluate(()=>{localStorage.removeItem('sfMoveApp_v1');return 0;});
  await p.goto(URL);await p.waitForTimeout(900);await p.click('#nav-trip');await p.waitForTimeout(600);
  await p.evaluate(()=>setTripSeg('charging'));await p.waitForTimeout(700);
  const hlp=await p.evaluate(()=>{const sel=document.querySelector('#trCharging select[data-sel=hlScope]');
    const lab=sel?sel.closest('.grp-h').innerText.replace(/\s+/g,' ').trim():null;
    return {opts:sel?[...sel.options].map(o=>o.value+'='+o.text):[],value:sel?sel.value:null,label:lab};});
  ok(hlp.opts[0]&&hlp.opts[0].indexOf('all=Trip')===0, `${w} Highlights lists Trip first (${hlp.opts.join(' | ')})`);
  ok(hlp.value==='all'&&/Trip/.test(hlp.label||''), `${w} and opens on it by default (${hlp.label})`);

  /* ---------- a place row title is one line ---------- */
  await p.evaluate(()=>setTripSeg('places'));await p.waitForTimeout(700);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#trPlaces .row.one .t1')].map(el=>{
    const lh=parseFloat(getComputedStyle(el).lineHeight)||18;
    return {t:el.textContent.trim(),lines:Math.round(el.getBoundingClientRect().height/lh)};}));
  ok(rows.length>0&&rows.every(r=>r.lines===1), `${w} every place row title is one line${rows.filter(r=>r.lines!==1).map(r=>' — "'+r.t+'"').join('')}`);

  ok(errs.length===0, `${w} no page or console errors${errs.length?' — '+errs[0]:''}`);
  await c.close();
}
await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
