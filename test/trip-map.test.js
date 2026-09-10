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

  /* ---------- the picker and its section stay BELOW the map at every width; from 768 the side column
     follows the sub-tab: Your route on Overview, and a 3-number strip plus a one-line list elsewhere ---------- */
  {
    const wide=w>=768;
    for(const sec of SECS){
      await seg(sec);
      const L=await p.evaluate(()=>{
        const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,r:r.right,b:r.bottom};};
        const map=document.querySelector('.trmap'),segEl=document.getElementById('tripSeg');
        const active=document.querySelector('.trsec.on'),rail=document.getElementById('tripRail');
        const one=el=>{const lh=parseFloat(getComputedStyle(el).lineHeight)||parseFloat(getComputedStyle(el).fontSize)*1.2;
          return el.getBoundingClientRect().height<=lh*1.6;};
        const rows=rail?[...rail.querySelectorAll('.row')]:[];
        const strips=rail?[...rail.querySelectorAll('.statrow')]:[];
        return {activeId:active.id,
          segBelowMap:segEl.getBoundingClientRect().top>=map.getBoundingClientRect().bottom-1,
          activeBelowSeg:active.getBoundingClientRect().top>=segEl.getBoundingClientRect().bottom-1,
          inMapCard:!!map.contains(segEl)||!!map.contains(active),
          railVisible:!!(rail&&rail.offsetParent),
          route:rail?rail.querySelectorAll('.trstep').length:0,stops:STOPS.length,
          strips:strips.length,stripCells:strips.map(s=>s.querySelectorAll('.st').length),
          stripVals:strips.map(s=>[...s.querySelectorAll('.st')].map(c=>c.querySelector('b').textContent.trim())),
          titles:rail?[...rail.querySelectorAll('.grp-h')].map(e=>e.textContent.trim()):[],
          rows:rows.length,
          wraps:rows.filter(r=>[...r.querySelectorAll('.t1,.v1')].some(e=>!one(e))).map(r=>r.innerText.replace(/\s+/g,' ')),
          clipped:rows.filter(r=>[...r.querySelectorAll('.t1')].some(e=>getComputedStyle(e).textOverflow!=='ellipsis')).length,
          tappable:rows.filter(r=>r.getAttribute('role')==='button').length};});
      ok(L.segBelowMap&&L.activeBelowSeg&&!L.inMapCard, `${w}/${sec} picker and section stay below the map (${L.activeId})`);
      if(!wide){ ok(!L.railVisible, `${w}/${sec} no column on the phone`); continue; }
      if(sec==='overview'){
        ok(L.route===L.stops&&L.strips===0&&L.rows===0,
           `${w}/overview the column is Your route alone — ${L.route} steps, no strip, no list`);
      }else{
        ok(L.route===0, `${w}/${sec} no Your route here`);
        ok(L.strips===1&&L.stripCells[0]===3, `${w}/${sec} exactly one 3-value strip (${L.stripVals[0].join(' · ')})`);
        ok(L.rows>0&&L.tappable===L.rows-(sec==='daily'?1:0), `${w}/${sec} ${L.rows} list rows, tappable${sec==='daily'?' bar the ETA line':''}`);
        ok(L.wraps.length===0, `${w}/${sec} nothing wraps${L.wraps.length?' — '+L.wraps[0]:''}`);
        ok(L.clipped===0, `${w}/${sec} every title ellipsizes at the end`);
      }
    }
    if(wide){
      /* every strip figure is the one the section below the map already renders — never a second computation */
      const same=(a,b)=>a===b;
      await seg('charging');
      const C=await p.evaluate(()=>({strip:[...document.querySelectorAll('#tripRail .statrow .st b')].map(e=>e.textContent.trim()),
        below:[...document.querySelectorAll('#trCharging .statrow .st b')].map(e=>e.textContent.trim()).slice(0,3)}));
      ok(C.strip.join('|')===C.below.join('|'), `${w} Charging strip = the section's own stat row (${C.strip.join(' · ')})`);
      await seg('hotels');
      const H=await p.evaluate(()=>({strip:[...document.querySelectorAll('#tripRail .statrow .st b')].map(e=>e.textContent.trim()),
        below:[...document.querySelectorAll('#trHotels .statrow .st b')].map(e=>e.textContent.trim()).slice(0,3)}));
      ok(H.strip.join('|')===H.below.join('|'), `${w} Hotels strip = the section's own stat row (${H.strip.join(' · ')})`);
      await seg('daily');
      const Dl=await p.evaluate(()=>{
        const strip=[...document.querySelectorAll('#tripRail .statrow .st')].map(c=>c.querySelector('b').textContent.trim()+'/'+c.querySelector('span').textContent.trim());
        const mapStrip={};document.querySelectorAll('#tripStrip .tr-c').forEach(c=>{mapStrip[c.querySelector('span').textContent.trim()]=c.querySelector('b').textContent.trim();});
        const hero=[...document.querySelectorAll('#trDaily .statrow .st')].map(c=>c.querySelector('b').textContent.trim()+'/'+c.querySelector('span').textContent.trim());
        return {strip,mapStrip,hero,day:tripDayNow()};});
      ok(Dl.strip[1].split('/')[0]===Dl.mapStrip['time to go'], `${w} Daily strip "time to go" = the strip under the map (${Dl.strip[1]})`);
      ok(Dl.strip[2].split('/')[0]===Dl.mapStrip['spent today'], `${w} Daily strip "spent today" = the strip under the map (${Dl.strip[2]})`);
      ok(Dl.hero.join(' ').indexOf(Dl.strip[0].split('/')[0])>=0, `${w} Daily strip miles = the day card below (${Dl.strip[0]} vs ${Dl.hero[0]})`);
      /* the Daily column is TODAY and nothing else */
      const only=await p.evaluate(()=>{const cur=tripDayNow();
        const rows=[...document.querySelectorAll('#tripRail .row')].map(r=>r.innerText.replace(/\s+/g,' ').trim());
        const otherDay=[];
        CHARGES.filter(c=>!c.planned&&c.date&&dayForDate(parseYMD(c.date))!==cur)
          .forEach(c=>{if(rows.some(t=>t.indexOf(chgPlace(c)+' \u00b7 '+fmtTime(chgWall(c)))===0))otherDay.push(c.id);});
        allPlaces().filter(pl=>pl.date&&dayForDate(parseYMD(pl.date))!==cur)
          .forEach(pl=>{if(rows.some(t=>t.indexOf(pl.name)===0))otherDay.push(pl.id);});
        nightsList().filter(n=>n.day!==cur&&n.needsRoom)
          .forEach(n=>{if(rows.some(t=>t.indexOf(hotelName(n.s))===0))otherDay.push(n.s.id);});
        return {otherDay,cur,rows};});
      ok(only.otherDay.length===0, `${w} the Daily column carries nothing from another day (Day ${only.cur}: ${only.rows.length} rows)`);
      /* Places and Itinerary strips reconcile with their own data */
      await seg('places');
      const P=await p.evaluate(()=>{const pls=allPlaces().filter(x=>x.date);const d={};let sp=0;
        pls.forEach(x=>{d[dayForDate(parseYMD(x.date))]=1;sp+=x.cost||0;});
        return {strip:[...document.querySelectorAll('#tripRail .statrow .st b')].map(e=>e.textContent.trim()),
          want:[String(pls.length),String(Object.keys(d).length),money(sp)]};});
      ok(P.strip.join('|')===P.want.join('|'), `${w} Places strip reconciles with the places themselves (${P.strip.join(' · ')})`);
      await seg('itinerary');
      const I=await p.evaluate(()=>({strip:[...document.querySelectorAll('#tripRail .statrow .st b')].map(e=>e.textContent.trim()),
        want:[num(TOTAL_MI),String(TRIP_DAYS),fmtShort(addDays(departDate(),TRIP_DAYS-1))],
        days:document.querySelectorAll('#tripRail .row').length,today:document.querySelectorAll('#tripRail .row.today').length}));
      ok(I.strip.join('|')===I.want.join('|'), `${w} Itinerary strip reconciles with the route (${I.strip.join(' · ')})`);
      ok(I.days===6&&I.today===1, `${w} one row per day with today highlighted (${I.days} rows, ${I.today} today)`);
      await seg('overview');
    }
  }

  /* ---------- no retired-stop marker is drawn, on any layer ---------- */
  {
    const marks=await p.evaluate(()=>{
      const out={};
      const at=(el)=>({x:+(el.getAttribute('cx')||el.getAttribute('data-cx')||NaN),y:+(el.getAttribute('cy')||el.getAttribute('data-cy')||NaN)});
      out.backupPts=BACKUPS.map(b=>({id:b.id,...proj(b.lat,b.lng)}));
      out.byLayer={};
      ['route','chg','places','hotel','life'].forEach(m=>{
        setMapMode(m);
        const node=[...document.querySelectorAll('#nodeG circle')].map(at);
        const lod=[...document.querySelectorAll('#lodG circle')].map(at);
        const near=[...node,...lod].filter(q=>out.backupPts.some(b=>Math.hypot(b.x-q.x,b.y-q.y)<1.2));
        out.byLayer[m]={bk:document.querySelectorAll('#tripSvg .bk').length,bl:document.querySelectorAll('#tripSvg .bl').length,
          td:document.querySelectorAll('#tripSvg .td').length,onBackup:near.length,
          nodeCircles:node.length,lodCircles:lod.length};
      });
      setMapMode('route');
      /* every circle left in #nodeG must BE a real stop */
      const stops=STOPS.map(s=>proj(s.lat,s.lng));
      const orphans=[...document.querySelectorAll('#nodeG circle')].map(at)
        .filter(q=>!stops.some(sp=>Math.hypot(sp.x-q.x,sp.y-q.y)<1.2)).length;
      out.orphans=orphans;out.nStops=STOPS.length;
      out.nodeCircles=document.querySelectorAll('#nodeG circle').length;
      out.townNames=document.querySelectorAll('#lodG .tn').length;
      return out;});
    const layers=Object.keys(marks.byLayer);
    ok(layers.every(m=>marks.byLayer[m].bk===0&&marks.byLayer[m].bl===0), `${w} no backup dot or label on any layer (${layers.join(', ')})`);
    ok(layers.every(m=>marks.byLayer[m].td===0), `${w} no town dot on any layer`);   /* scoped to #tripSvg: .bl is also the bar-row label class elsewhere in the app */
    ok(layers.every(m=>marks.byLayer[m].onBackup===0), `${w} nothing is drawn at any of the ${marks.backupPts.length} retired stops (${marks.backupPts.map(b=>b.id).join(', ')})`);
    ok(marks.orphans===0&&marks.nodeCircles===marks.nStops, `${w} every route marker left IS a real stop (${marks.nodeCircles} for ${marks.nStops} stops)`);
    ok(marks.townNames>0, `${w} town NAMES stay for orientation (${marks.townNames})`);
    /* the data and the stop cards are untouched */
    const chips=await p.evaluate(()=>{
      setTripSeg('itinerary');
      const withBackup=STOPS.filter(s=>s.backup).map(s=>s.backup);
      const txt=document.getElementById('tripStops').textContent;   /* the chip lives in the collapsed More fold, invisible to innerText */
      return {want:withBackup,shown:withBackup.filter(id=>{
        const b=BACKUPS.filter(x=>x.id===id)[0];return b&&txt.indexOf(b.name.split(',')[0])>=0;})};});
    ok(chips.want.length>0&&chips.shown.length===chips.want.length,
       `${w} the backup chips on the stop cards are unchanged (${chips.shown.join(', ')})`);
    await seg('overview');
  }

  ok(errs.length===0, `${w} no page or console errors${errs.length?' — '+errs[0]:''}`);
  await c.close();
}
await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
