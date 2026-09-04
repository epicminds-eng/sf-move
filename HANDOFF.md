# SF Move — handoff

## Status
v30 · Sep 4 · main = d54a5fe. Single-file PWA: index.html (~1,770 lines) + sf-icon.png + design/sf-move-spend-mockup.html. All state in localStorage key sfMoveApp_v1. Served from epicminds-eng.github.io/sf-move per the in-app Shortcut recipe (Pages deployment unverified this session).

## Built
- Tabs Move · Sort · Pack · Trip · Spend on an app-shell layout: #scroll container (index.html:303), fixed <nav> as a body child (:478), per-tab scroll memory (:1745).
- Move: 7 phase checklists + custom tasks + Reference card; the old Info tab lives on as EXTRA blocks (:756); Export app data at the bottom (share sheet first, select-all modal fallback, :1161).
- Sort: 116 items, tags car/ship/joey/undecided/leave/sell, notes, remove/restore; the 8 tally tiles are exclusive filter buttons persisted in state.sortFilter (:906).
- Pack: car/ship/joey items with packed flags; circle-only toggle that commits on release (:1033).
- Trip: option-B SVG map with real state outlines (:384); stops St. Robert → Weatherford → Albuquerque → Mom's → Seychelle's LA → 1442A Grove St SF (STOPS :1225, BACKUPS :1253, WAYPTS :1261); road-following live tracking (locate :1308); trip.departDate is the single source for every date (:813, :821); Orbitz links derive their dates (:822).
- Spend: planned/actual entries, per-day add forms with the current day open, projection + budget, seeded planned entries (:1499), URL ingest ?add=&m= and paste import with a merchant table (:1659–:1745).

## Rough
- Everything was verified only in headless Chromium with an iPhone UA (Playwright). Nothing was run on a real iPhone this session: tab-bar detach fix, date picker, clipboard, share sheet, geolocation prompt are all unverified on device.
- Stale mover-era prose remains in Sort/Reference copy (index.html:501, :507, :590, :646, :772, :776); content only, left deliberately after the v25/v26 cleanup.
- The Sort hero "116 items · 8 categories" is static text; update by hand if items change.
- Spend day-card layout follows the written spec, not a mockup (no design/sf-move-spend-daycards-mockup.html exists).
- Mom's auto-arrive radius is ~5 mi around 33.22721,-111.88610; Chandler city center (6 mi out) does not trigger it.

## Where things live
- State init + migrations: index.html:779–806 (departDate default/flag :798–801, retired-stop arrived reset :805, spend :806).
- Renderers: renderMove :835, renderSort :906, renderPack :1033, Trip :1224, Spend :1473, tabs :1745.
- Playwright verification scripts were scratchpad-only and are not in the repo; Chromium is preinstalled at /opt/pw-browsers/chromium in the cloud environment.

## Last session (v20 → v30)
v20 final hotels, Day 3 = Albuquerque · v21 Info folded into Move · v22–v23 Spend tab, then aligned to the mockup · v24 per-day add forms · v25–v26 mover-era Move copy retired · v27 Sort tile filters · v28 URL ingest + paste import · v29 SF address in Trip/Joey/USPS · v30 Joey Ship Sticks from/to with Copy.

## Next
- Test on the actual iPhone as a standalone PWA: tab bar, date picker, Copy/Share, geolocation.
- Decide the remaining mover-era copy lines above; wire the Wallet Shortcut to ?add= once Pages is confirmed live.
