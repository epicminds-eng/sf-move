# SF Move — handoff

## Status
v37 · Sep 5 · previous main head 86850d2. Single-file PWA: index.html (~2136 lines) + sf-icon.png + design/sf-move-spend-mockup.html. All state in localStorage key sfMoveApp_v1. Served from epicminds-eng.github.io/sf-move per the in-app Shortcut recipe (Pages deployment unverified this session).

## Built
- Tabs Move · Sort · Pack · Trip · Spend on an app-shell layout: #scroll container (index.html:303), fixed <nav> as a body child (:478), per-tab scroll memory (:1745).
- Move: 7 phase checklists + custom tasks + Reference card; the old Info tab lives on as EXTRA blocks (:756); Export app data at the bottom (share sheet first, select-all modal fallback, :1161).
- Sort: 116 items, tags car/ship/joey/undecided/leave/sell, notes, remove/restore; the 8 tally tiles are exclusive filter buttons persisted in state.sortFilter (:906).
- Pack: "Before I leave" last-morning checklist card at the top (BEFORE_LEAVE + renderBeforeLeave :1067, ids bl-*, custom tasks in state.customTasks.bl, collapse key ph-bl, excluded from packed counts); car/ship/joey items with packed flags; circle-only toggle that commits on release (renderPack :1127).
- Trip: near-square map hero — viewBox "0 0 380 300" shows the mockup canvas whole (projection untouched, only the crop grew), the SVG spans the full card at aspect-ratio 380/300 (~283 px tall on a 390 px phone), route dead centre. Option-B state outlines (:414) plus the Canada/Alaska outline (:417) lifted verbatim from the same mockup (recovered from this session's transcript): it was skipped while the crop was 0 62 380 168, and without it the taller crop paints ocean where land belongs. All map content is inside <g id="zoomLayer"> (:412) with pinch-zoom 1–5× + pan (module :1623: Pointer Events, rubber-band, momentum → critically damped rAF springs, double-tap/Reset pill reset, counter-scaled nodes/labels/live dot, touch-action pan-y at 1× and none while zoomed, reset on tab change, never persisted); level-of-detail layers in <g id="lodG"> (TOWNS :1483, SHIELDS :1519, buildLOD/updateLOD :1482–:1562): 33 towns + 6 highway shields fade in 1.6→2.2×, charger names 2.6→3.2×, all counter-scaled around their node; a town hides when its estimated box (tbox, 0.56 em/char) hits a stop/backup label, a visible charger name, or an earlier town; stop/backup/charger labels counter-scale around the node point (data-cx/cy) so their offset is constant on screen; stops St. Robert → Weatherford → Albuquerque → Mom's → Seychelle's LA → 1442A Grove St SF (STOPS :1324, BACKUPS :1352, WAYPTS :1372 incl. a Lost Hills I-5 waypoint); road-following live tracking (locate :1420); CHARGES Supercharger log (:1368, code-seeded; shape in the comment) → Tesla-red #E82127 nodes on the map + a tap-to-expand "Charging" row under the mileage line (renderCharging :1597, red dot icons, Apple Maps links per session). planned:true entries (today: chg-oasis, Tesla Oasis Lost Hills) draw hollow, list as "Planned · name", never touch Spend or totals; swap the object in place for a real session and it fills in + seeds Spend; trip.departDate is the single source for every date (default 2026-09-06, migrations V1 09-04→09-05 and V2 09-05→09-06 at :799–:808, each flagged once and never re-applied); Orbitz links derive their dates (:827).
- Spend: planned/actual entries, per-day add forms with the current day open, projection + budget, seeded planned entries (:1849), CHARGES auto-seeded as actual charging entries with id = charge id (seedCharges :2011, skips planned; deleting one records spend.dismissedCharges[id] so it never comes back), URL ingest ?add=&m= and paste import with a merchant table (:2025–:2109).

## Rough
- Everything was verified only in headless Chromium with an iPhone UA (Playwright, CDP touch events for the map). Nothing was run on a real iPhone this session: tab-bar detach fix, date picker, clipboard, share sheet, geolocation prompt, and especially the map pinch (Safari must hand a two-finger gesture on a touch-action:pan-y SVG to JS) are unverified on device.
- Stale mover-era prose remains in Sort/Reference copy (index.html:501, :507, :590, :646, :772, :776); content only, left deliberately after the v25/v26 cleanup.
- The Sort hero "116 items · 8 categories" is static text; update by hand if items change.
- A Reset or double-tap takes ~1.2 s to settle exactly on 1×; until it lands the map keeps touch-action:none, so a one-finger drag pans instead of scrolling.
- Map LOD collision uses estimated text boxes, not getBBox (the Trip page is display:none at init), so a near-miss can still touch; shields are hand-placed mid-leg over the route (no mockup existed for them).
- Spend day-card layout follows the written spec, not a mockup (no design/sf-move-spend-daycards-mockup.html exists).
- CHARGES holds only the planned Oasis entry; real sessions were verified with temporary objects (Portage IN / OKC, and Oasis as a real session) then removed. A seeded charge keeps its day/stopId if departDate changes later.
- Mom's auto-arrive radius is ~5 mi around 33.22721,-111.88610; Chandler city center (6 mi out) does not trigger it.

## Where things live
- State init + migrations: index.html:833–846 (departDate default + V1/V2 flags :834–:842, retired-stop arrived reset :845, spend :846; spend.dismissedCharges is created lazily on first delete).
- Renderers: renderMove :876, renderSort :955, renderBeforeLeave :1121, renderPack :1166, Trip :1323, map LOD :1482, map zoom :1623, Spend :1823, tabs :2112.
- Playwright verification scripts were scratchpad-only and are not in the repo; Chromium is preinstalled at /opt/pw-browsers/chromium in the cloud environment.

## Last session (v20 → v37)
v20 final hotels, Day 3 = Albuquerque · v21 Info folded into Move · v22–v23 Spend tab, then aligned to the mockup · v24 per-day add forms · v25–v26 mover-era Move copy retired · v27 Sort tile filters · v28 URL ingest + paste import · v29 SF address in Trip/Joey/USPS · v30 Joey Ship Sticks from/to with Copy · v31 Pack "Before I leave" checklist (verified headless only: order, toggles + collapse persist across reload, add/delete task, packed counts unaffected) · v32 departure moved to Sun Sept 6 (default + dateMigratedV2; a date the user changed after V1 is left alone) · v33 CHARGES log feeding Trip map + Spend · v34 planned chargers (Tesla Oasis, Lost Hills) + I-5 waypoint · v35 Tesla-red chargers, pinch-zoom + pan map with springs · v36 level-of-detail towns, shields, charger names on zoom (+ label anchoring fix) · v37 near-square hero crop, Canada outline restored.

## Next
- Test on the actual iPhone as a standalone PWA: tab bar, date picker, Copy/Share, geolocation, map pinch/pan/double-tap.
- Log real Supercharger sessions into CHARGES as the drive happens (one object per session, ids chg-001…).
- Decide the remaining mover-era copy lines above; wire the Wallet Shortcut to ?add= once Pages is confirmed live.
