/* SF Move — Move tab checklist seeds.
 *
 *   NODE_PATH=$(npm root -g) node test/move-seeds.test.js
 *
 * PHASES is a constant read on EVERY render; the only thing the store keeps per item is done[id].
 * So an item appended to a card must appear on a device whose store is already populated, with
 * no migration, and without disturbing a single existing tick. This test loads such a store —
 * the neighbouring item ticked, a custom task on the same card, the card's collapse untouched —
 * and asserts the FasTrak item renders once, unchecked, and the card count went up by exactly one.
 * Baseline counts are derived from PHASES in the page, never retyped.
 */
const path=require('path');
const {chromium}=require('playwright');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const EXE=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium';
const OUT=path.resolve(__dirname,'..','design','verify');
const NEW='fastrak-tag',CARD='landing';

let FAIL=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m);if(!c)FAIL++;};

/* a device that has lived with the After Landing card: one item ticked, one custom task added */
const STORE={done:{'assess-furniture':true,'decide-place':true},
  customTasks:{landing:[{id:'ct-landing-1757000000000',t:'Register Kane with SF Animal Care'}]},
  collapsed:{},disp:{},custom:{},removed:{},notes:{},packed:{},
  trip:{departDate:'2026-09-06',arrived:{},arrivedAt:{},rolled:{}},
  spend:{entries:[]},meta:{stamped:true,touched:{}}};

(async()=>{
const b=await chromium.launch({executablePath:EXE});
const ver=await(async()=>{const p=await b.newPage();await p.goto(URL);
  const v=await p.evaluate(()=>(document.querySelector('.appver').textContent.match(/v(\d+)/)||[])[1]);await p.close();return v;})();

for(const [w,h] of [[390,844],[1194,834]]){
  console.log(`\n===== ${w}×${h} =====`);
  const c=await b.newContext({viewport:{width:w,height:h}});
  await c.addInitScript(S=>{localStorage.setItem('sfMoveApp_v1',JSON.stringify(S));},STORE);
  const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await p.goto(URL);await p.waitForTimeout(900);
  await p.click('#nav-move');await p.waitForTimeout(400);

  const d=await p.evaluate(({NEW,CARD})=>{
    const ph=PHASES.find(x=>x.id===CARD),item=ph.items.find(x=>x.id===NEW);
    const seedIds=ph.items.map(x=>x.id),custom=(state.customTasks[CARD]||[]);
    /* the card is the .card whose header carries this phase's title */
    const cards=[].slice.call(document.querySelectorAll('#phaseGroups .card'));
    const card=cards.find(x=>x.querySelector('.sec-head .t').textContent===ph.title);
    const rows=card?[].slice.call(card.querySelectorAll('.check')):[];
    const row=rows.filter(r=>r.querySelector('.ct').textContent===item.t);
    /* the count span also carries the chevron glyph — read the count alone */
    const head=card?card.querySelector('.sec-head .m').textContent.replace(/\s*\u25BC\s*$/,'').trim():'';
    const nDone=seedIds.concat(custom.map(x=>x.id)).filter(id=>state.done[id]).length;
    return {item:item,seedDup:seedIds.filter(x=>x===NEW).length,idsUnique:new Set(seedIds).size===seedIds.length,
      last:seedIds[seedIds.length-1],
      before:seedIds.filter(x=>x!==NEW).length+custom.length,   /* what the card held before this item */
      rows:rows.length,rowHits:row.length,
      rowChecked:row.length?row[0].classList.contains('on'):null,
      rowAria:row.length?row[0].getAttribute('aria-checked'):null,
      rowNote:row.length?(row[0].querySelector('.cd')||{}).textContent:'',
      neighbourOn:!!state.done['assess-furniture']&&rows.some(r=>r.classList.contains('on')&&/Live in the place/.test(r.textContent)),
      customStill:rows.some(r=>/Register Kane/.test(r.textContent)),
      head:head,nDone:nDone,newDone:state.done[NEW]===undefined,
      otherTick:state.done['decide-place']===true,
      cardTop:card?card.getBoundingClientRect().top+window.scrollY:0};},{NEW,CARD});

  ok(d.item&&d.item.t==='Get a FasTrak toll tag for the bridges', `PHASES › ${CARD} carries the FasTrak item`);
  ok(d.item&&/all-electronic/.test(d.item.d)&&/bayareafastrak\.org/.test(d.item.d)&&/I-PASS \/ E-ZPass do not work in CA\./.test(d.item.d), `its note is the one asked for`);
  ok(d.seedDup===1&&d.idsUnique&&d.last===NEW, `id "${NEW}" is unique in the card and appended last`);
  ok(!/\b(open in|link to|tap to|go to|view|click)\b/i.test(d.item.t+' '+d.item.d), `wording never announces a link`);
  ok(d.rowHits===1, `renders exactly once on a populated store (${d.rowHits})`);
  ok(d.rows===d.before+1, `card count went up by exactly one: ${d.before} → ${d.rows}`);
  ok(d.head===`${d.nDone}/${d.rows}`, `header reads ${d.head} — ${d.nDone} done of ${d.rows}`);
  ok(d.rowChecked===false&&d.rowAria==='false'&&d.newDone, `unchecked by default, and nothing was written to done["${NEW}"]`);
  ok(d.neighbourOn&&d.otherTick, `existing ticks are untouched (assess-furniture on, decide-place on)`);
  ok(d.customStill, `the device's own custom task on the card is still there`);
  ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);

  /* the card in frame, then the shot */
  /* park the card just under the sticky title bar so its own header row is in the shot */
  await p.evaluate(top=>{const s=document.getElementById('scroll')||document.scrollingElement;const bar=document.querySelector('header,.hdr,.topbar');const off=bar?bar.getBoundingClientRect().height:0;s.scrollTo(0,Math.max(0,top-off-12));},d.cardTop);
  await p.waitForTimeout(300);
  /* shots are named by the live footer, so an unguarded run would file a new set on every version bump;
     write them only for a verify pass: SHOTS=1 node test/move-seeds.test.js */
  if(process.env.SHOTS){
    const file=path.join(OUT,`v${ver}-fastrak-${w}.png`);
    await p.screenshot({path:file,fullPage:false});
    console.log(`  shot  ${path.relative(path.resolve(__dirname,'..'),file)}`);
  }
  await c.close();
}
/* ---------- Reference card: garage code field + After Landing: SF Setup pill ----------
   The code is typed on device and lives only in the store (ref.garageCode) — never in index.html, which
   is public. So this block also greps the source for the value it types, and expects NOT to find it. */
{
  const fs=require('fs'),SRC=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');
  const CODE='9062',SETUP='https://epicminds-eng.github.io/sf-setup/';
  ok(!SRC.includes(CODE), `index.html does not contain the code the test types (store-only by design)`);
  for(const [w,h] of [[390,844],[1194,834]]){
    console.log(`\n===== garage code + SF Setup @ ${w}×${h} =====`);
    const c=await b.newContext({viewport:{width:w,height:h}});
    const p=await c.newPage();const errs=[];
    p.on('pageerror',e=>errs.push('pageerror: '+e.message));
    p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
    await p.goto(URL);await p.waitForTimeout(900);
    await p.click('#nav-move');await p.waitForTimeout(400);
    /* the Move tab before anything is typed: the field is empty, the store has no code */
    const before=await p.evaluate(()=>{
      const inp=document.getElementById('garageCode');
      const titles=[].slice.call(document.querySelectorAll('#phaseGroups .sec-head .t')).map(e=>e.textContent);
      const want=PHASES.map(ph=>typeof ph.title==='function'?ph.title():ph.title).concat(['Reference']);
      const rows=document.querySelectorAll('#phaseGroups .check').length;
      const wantRows=PHASES.reduce((a,ph)=>a+ph.items.length+((state.customTasks[ph.id]||[]).length),0);
      const ref=[].slice.call(document.querySelectorAll('#phaseGroups .card')).find(x=>x.querySelector('.sec-head .t').textContent==='Reference');
      const inRef=!!(inp&&ref&&ref.contains(inp)),addr=ref?/1442A Grove St/.test(ref.innerText):false;
      return {has:!!inp,inRef:inRef,addr:addr,val:inp?inp.value:null,mode:inp?inp.getAttribute('inputmode'):null,
        tnum:inp?getComputedStyle(inp).fontVariantNumeric:null,stored:state.ref&&state.ref.garageCode,
        titles:titles.join('|'),want:want.join('|'),rows:rows,wantRows:wantRows};});
    ok(before.has&&before.inRef&&before.addr, `Garage code field sits on the Reference card next to the Grove St address`);
    ok(before.val===''&&!before.stored, `empty by default, nothing in the store`);
    ok(before.mode==='numeric'&&/tabular-nums/.test(before.tnum), `numeric keyboard, tabular figures (inputmode=${before.mode}, ${before.tnum})`);
    ok(before.titles===before.want, `card set is exactly PHASES + Reference — nothing else on Move changed`);
    ok(before.rows===before.wantRows, `checklist row count unchanged (${before.rows})`);
    /* type it, leave the field, reload */
    await p.fill('#garageCode',CODE);await p.dispatchEvent('#garageCode','change');await p.evaluate(()=>document.getElementById('garageCode').blur());
    await p.waitForTimeout(300);
    const typed=await p.evaluate(()=>({stored:state.ref.garageCode,raw:JSON.parse(localStorage.getItem('sfMoveApp_v1')).ref.garageCode}));
    ok(typed.stored===CODE&&typed.raw===CODE, `saved on change/blur to ref.garageCode in sfMoveApp_v1`);
    if(process.env.SHOTS){
      const ver=await p.evaluate(()=>(document.querySelector('.appver').textContent.match(/v(\d+)/)||[])[1]);
      await p.evaluate(()=>{const e=document.getElementById('garageCode');const s=document.getElementById('scroll')||document.scrollingElement;s.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+s.scrollTop-160));});
      await p.waitForTimeout(300);
      await p.screenshot({path:path.join(OUT,`v${ver}-garage-${w}.png`)});
    }
    await p.reload();await p.waitForTimeout(900);await p.click('#nav-move');await p.waitForTimeout(300);
    const after=await p.evaluate(()=>{
      const inp=document.getElementById('garageCode');let exp=null;try{exp=JSON.parse(exportJSON());}catch(e){}
      const landing=[].slice.call(document.querySelectorAll('#phaseGroups .card')).find(x=>/After Landing/.test(x.querySelector('.sec-head .t').textContent));
      const pills=landing?[].slice.call(landing.querySelectorAll('.btns a.btn')):[];
      const pill=pills.find(a=>a.textContent.trim()==='SF Setup');
      return {val:inp?inp.value:null,stored:state.ref.garageCode,exp:exp&&exp.ref&&exp.ref.garageCode,
        pill:!!pill,href:pill?pill.getAttribute('href'):null,pillTexts:pills.map(a=>a.textContent.trim()),
        isItem:landing?[].slice.call(landing.querySelectorAll('.check .ct')).some(e=>/SF Setup/.test(e.textContent)):false};});
    ok(after.val===CODE&&after.stored===CODE, `persists across a reload (${after.val})`);
    ok(after.exp===CODE, `appears in the Export JSON at ref.garageCode`);
    ok(after.pill&&after.href===SETUP, `"SF Setup" link pill on After Landing → ${after.href}`);
    ok(!after.isItem, `it is a link pill, not a checklist item`);
    ok(after.pillTexts.every(t=>!/\b(open in|link to|tap to|go to|view|click)\b/i.test(t)), `pill labels never announce a link (${after.pillTexts.join(' · ')})`);
    ok(errs.length===0, `no page or console errors${errs.length?' — '+errs[0]:''}`);
    await c.close();
  }
}

await b.close();
console.log(FAIL?`\n${FAIL} FAILURE(S)`:'\nALL CHECKS PASSED');
process.exit(FAIL?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
