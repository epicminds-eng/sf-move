# SF Move — handoff

## Status
v33 · Sep 5 · previous main head 6e521d1. Single-file PWA: index.html (~1,895 lines) + sf-icon.png + design/sf-move-spend-mockup.html. All state in localStorage key sfMoveApp_v1. Served from epicminds-eng.github.io/sf-move per the in-app Shortcut recipe (Pages deployment unverified this session).

## Built
- Tabs Move · Sort · Pack · Trip · Spend on an app-shell layout: #scroll container (index.html:303), fixed <nav> as a body child (:478), per-tab scroll memory (:1745).
- Move: 7 phase checklists + custom tasks + Reference card; the old Info tab lives on as EXTRA blocks (:756); Export app data at the bottom (share sheet first, select-all modal fallback, :1161).
- Sort: 116 items, tags car/ship/joey/undecided/leave/sell, notes, remove/restore; the 8 tally tiles are exclusive filter buttons persisted in state.sortFilter (:906).
- Pack: "Before I leave" last-morning checklist card at the top (BEFORE_LEAVE + renderBeforeLeave :1067, ids bl-*, custom tasks in state.customTasks.bl, collapse key ph-bl, excluded from packed counts); car/ship/joey items with packed flags; circle-only toggle that commits on release (renderPack :1127).
- Trip: option-B SVG map with real state outlines (:385); stops St. Robert → Weatherford → Albuquerque → Mom's → Seychelle's LA → 1442A Grove St SF (STOPS :1300, BACKUPS :1328, WAYPTS :1343); road-following live tracking (locate :1390); CHARGES Supercharger log (:1341, code-seeded, currently EMPTY, shape in the comment) → ⚡ nodes on the map + a tap-to-expand "Charging" row under the mileage line (renderCharging :1463, Apple Maps links per session); trip.departDate is the single source for every date (default 2026-09-06, migrations V1 09-04→09-05 and V2 09-05→09-06 at :799–:808, each flagged once and never re-applied); Orbitz links derive their dates (:827).
- Spend: planned/actual entries, per-day add forms with the current day open, projection + budget, seeded planned entries (:1610), CHARGES auto-seeded as actual charging entries with id = charge id (seedCharges :1772; deleting one records spend.dismissedCharges[id] so it never comes back), URL ingest ?add=&m= and paste import with a merchant table (:1786–:1870).

## Rough
- Everything was verified only in headless Chromium with an iPhone UA (Playwright). Nothing was run on a real iPhone this session: tab-bar detach fix, date picker, clipboard, share sheet, geolocation prompt are all unverified on device.
- Stale mover-era prose remains in Sort/Reference copy (index.html:501, :507, :590, :646, :772, :776); content only, left deliberately after the v25/v26 cleanup.
- The Sort hero "116 items · 8 categories" is static text; update by hand if items change.
- Spend day-card layout follows the written spec, not a mockup (no design/sf-move-spend-daycards-mockup.html exists).
- CHARGES was verified with two temporary sessions (Portage IN / OKC) then emptied; nothing real is logged yet. A seeded charge keeps its day/stopId if departDate changes later.
- Mom's auto-arrive radius is ~5 mi around 33.22721,-111.88610; Chandler city center (6 mi out) does not trigger it.

## Where things live
- State init + migrations: index.html:780–822 (departDate default + V1/V2 flags :799–:808, retired-stop arrived reset :821, spend :822; spend.dismissedCharges is created lazily on first delete).
- Renderers: renderMove :852, renderSort :931, renderBeforeLeave :1097, renderPack :1142, Trip :1299, Spend :1600, tabs :1873.
- Playwright verification scripts were scratchpad-only and are not in the repo; Chromium is preinstalled at /opt/pw-browsers/chromium in the cloud environment.

## Last session (v20 → v33)
v20 final hotels, Day 3 = Albuquerque · v21 Info folded into Move · v22–v23 Spend tab, then aligned to the mockup · v24 per-day add forms · v25–v26 mover-era Move copy retired · v27 Sort tile filters · v28 URL ingest + paste import · v29 SF address in Trip/Joey/USPS · v30 Joey Ship Sticks from/to with Copy · v31 Pack "Before I leave" checklist (verified headless only: order, toggles + collapse persist across reload, add/delete task, packed counts unaffected) · v32 departure moved to Sun Sept 6 (default + dateMigratedV2; a date the user changed after V1 is left alone) · v33 CHARGES log feeding Trip map + Spend.

## Next
- Test on the actual iPhone as a standalone PWA: tab bar, date picker, Copy/Share, geolocation.
- Log real Supercharger sessions into CHARGES as the drive happens (one object per session, ids chg-001…).
- Decide the remaining mover-era copy lines above; wire the Wallet Shortcut to ?add= once Pages is confirmed live.
