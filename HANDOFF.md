# SF Move — handoff

## Status
v103 · Sep 10 · previous main head 1d9f443. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/*.png (acceptance shots per build — the v102-sidecol-* set shows a layout v103 reverted, kept as that build's record) + test/trip-time.test.js and test/trip-map.test.js. All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v103)
- v103 REVERTED v102's WIDE LAYOUT. index.html was restored from 0f09cac (the pre-v102 file) and v102's marker removal re-applied on top, so the restore is exact rather than hand-unwound: the picker and its section are below the map at EVERY width, `.trrailw` is back inside `.trmap`, and from 768px the map card is again `grid-template-columns:70% 30%` with Your route in the right column. `#tripCol`, `.trmapcard`, the page-level grid, `railHtml()`, `scrollBox()`/`segPad()` and the Overview-owns-the-rail change are all gone.
- v103 KEPT the retired-stop removal: the four BACKUPS dots + labels draw nothing (in `buildTripMap` and in the LOD collision list) and the town layer lost its `.td` dots, keeping its NAMES for orientation. A marker means a real stop, a charger, a place or a hotel. STOPS data and the stop cards' backup chips are untouched.
- v103 ADDED THE COLUMN CONTEXT BLOCK, wide only. `railCtx()` appends one `grp()` of ordinary `row()`s under Your route inside `.trrail`, so it inherits the rail's `display:none` below 768 — no JS width branch, and the phone never sees it. Hotels → "Nights" (`Night 3 · Holbrook` + a `$231` tinted `.ok` when booked, `.todo` when not); Places → "Places" (`name · Day 2` + cost); Charging → "Today's charges" (`Quartzsite, AZ · 8:53 AM` + `44 kWh · $18`) for `chgDaySel()`, which is now the ONE home for which day the Charging section shows. Overview, Daily and Itinerary render nothing — the column is Your route alone. Every row is one line with an end ellipsis (`.row.one` + `.trctx` scoping rules).
- v103 TAPS reuse the existing behaviour: a Nights row calls `toggleHotel(id)` — extracted so the hotel card's own handler and the context row share one path (expand + drive the map); a Places row calls `openPlace(id)`; a charge row calls the new `openCharge(id)`, which mirrors openPlace (switch to the charging layer, centre at PIN_FY, deferred guarded popover). `railTap` handles all three before the `[data-stop]` case, and the rail gained the keyboard delegate the other sections have.
- v101/v100: chg-024 Quartzsite and chg-023 Buckeye — 24 logged sessions, two on Day 5. Buckeye is 5.67 map units from chg-022 Chandler with CLUSTER_R 6, so those two share one badged pin though they are ~50 road miles apart.
- v99 the sub-tab owns the map frame, two-line popups, no link-announcing labels, no tildes, Highlights opens on Trip. v98 time zones. v97 the map layer bar, the taller hero, one-line stat rows.

## Rough
- The context block lives inside the rail, so on a phone it is in the DOM but `display:none` — the same mechanism the rail itself has always used. Tests assert visibility, not presence.
- Places' context block lists every place, not the framed day's; Charging's follows the Sessions day picker, not "today" despite the title Chad specified.
- The column still grows the map card to the taller of map and column, so a long Nights list pushes Up next and the strip down. That is the pre-v102 behaviour, unchanged.
- Spend's per-day headers each print WHOLE dollars, so six rounded headers need not sum to the rounded grand total. The invariant is per day.
- Only STOPS and charge addresses carry zones; extend TZ_STATE if the route leaves IL/MO/OK/TX/KS/NM/CO/AZ/CA/NV.
- Everything is verified only in headless Chromium. Nothing has been run on a real iPhone or iPad.
- Map LOD collision uses estimated text boxes, not getBBox (the Trip page is display:none at init).

## Where things live
- Wide layout: the `@media (min-width:768px)` block at :319 (map card 70/30). Context block: `railCtx` / `toggleHotel` / `openCharge` right after `renderRail` :2530; its CSS beside `.trrail` at :300; `chgDaySel` above `renderChargingSec`.
- Map build: buildTripMap :1950, buildLOD :2010. Map frame: mapFrame / fitPts :2290, frameMapFor :2870. Popups: popPill / pinPopOpen :2750+.
- Zones: TZ_STATE / zonedToEpoch / chgTz / chgTs / chgWall :2104–2140. Trip: dayStats :2480, tripStats :2514.
- TESTS in the repo: `NODE_PATH=$(npm root -g) node test/trip-map.test.js` (frames, popups, the below-map layout and the context block at both widths, retired-stop markers, wording and tilde sweeps) and `test/trip-time.test.js` (zones). verify-74…verify-97 + edge are SCRATCHPAD-ONLY. HARNESS RULE: never retype a number that also lives in index.html. v103 returned verify-78 and verify-80 to the pre-v102 truth (one Your route list, in the map card) and replaced trip-map's side-column block with the below-map + context-block assertions.

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins), then the iPad.
- Try the context block on the real iPad — row height and ellipsis in a 30% column at both orientations.
- Keep logging the drive: sessions into CHARGES (chg-025…), receipts into EXPENSES (exp-009…); both seed Spend once by id.
- Read the footer before the next bump. This build is v103.
