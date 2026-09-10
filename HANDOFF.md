# SF Move — handoff

## Status
v102 · Sep 10 · previous main head 0f09cac. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/*.png (acceptance shots per build) + test/trip-time.test.js and test/trip-map.test.js (the repo's own assertions). All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v102)
- v102 THE SIDE COLUMN IS THE SUB-TAB. From 768px `#page-trip.active` is itself the two-column grid: row 1 the header, row 2 the progress card (both spanning), row 3 `.trmapcard` (map + Up next + strip, wrapped as ONE grid item so the column beside it cannot open a gap between map and strip) beside `#tripCol`. `#tripCol` wraps the picker and all six `.trsec` sections; it is `position:sticky;top:0`, `max-height:calc(100vh - var(--tabh) - var(--s6))`, `overflow-y:auto` with `overflow-x:hidden` set explicitly (overflow-y:auto alone computes overflow-x to auto and reopens the sideways-pan bug), and `#tripSeg` is sticky at its top. Below the map there is now nothing but Up next and the strip. On a phone `#tripCol` is a plain block under the strip — the phone layout is byte-identical.
- v102 OVERVIEW OWNS "YOUR ROUTE". The rail left the map card: `railHtml()` builds it and `renderOverview` renders it FIRST, with Pace below, so the wide column shows exactly what it showed before. `.trrailw` is display:none below 768 (as the rail always was), so the phone section is unchanged. `renderRail()` is now only the Up next line. The rail is rebuilt on every render, so its taps come off the `#trOverview` delegate — the old direct `#tripRail` listener is gone. `scrollToCurrentStop` now finds the box that actually scrolls the card (`scrollBox()`) and clears the sticky picker, because from 768px the Itinerary scrolls inside the column, not the page.
- v102 RETIRED STOPS DRAW NOTHING. The four BACKUPS dots + labels are gone from `buildTripMap` and from the LOD collision list, and the town layer lost its `.td` dots (its NAMES stay for orientation). A marker on this map now means a real stop, a charger, a place or a hotel — nothing else. The data is untouched: STOPS still names its backup and the stop cards' backup chips still link to it.
- v101 chg-024 Quartzsite, AZ (08:53, 43.65 kWh, $17.89, 29 min) and v100 chg-023 Buckeye, AZ (07:16, 14.57 kWh, $5.39, 11 min) — 24 logged sessions, two on Day 5. Buckeye sits 5.67 map units from chg-022 Chandler and CLUSTER_R is 6, so those two share ONE badged pin though they are ~50 road miles apart; tighten CLUSTER_R if that reads wrong.
- v99 the sub-tab owns the map frame (`frameMapFor` / `fitPts` / `mapFrame`), two-line map popups (`popPill`), no link-announcing labels, no tildes, Highlights opens on Trip. v98 time zones (`zonedToEpoch`, `chgTs` vs `chgWall`). v97 the map layer bar, the 30%-taller hero, one-line stat rows.

## Rough
- Six tabs in a 343px column still scroll horizontally, exactly as on the phone. Nothing was added or resized to fit them.
- Places has no day picker of its own, so Daily and Places both frame `frameDay()` — Daily's selection if set, else today.
- Spend's per-day headers each print WHOLE dollars, so six rounded headers need not sum to the rounded grand total. The invariant is per day: each header equals that day's own entries, rounded. Do not re-assert the sum.
- A place row's META line still wraps at phone width (only the title is one-line).
- Only STOPS and charge addresses carry zones; extend TZ_STATE if the route leaves IL/MO/OK/TX/KS/NM/CO/AZ/CA/NV.
- Everything is verified only in headless Chromium. Nothing has been run on a real iPhone or iPad: the new column's sticky/scroll behaviour, tab-bar detach, date picker, clipboard, share sheet, geolocation, the standalone PWA shell.
- Map LOD collision uses estimated text boxes, not getBBox (the Trip page is display:none at init); a few LOD town labels sit outside the crop horizontally (pre-existing).

## Where things live
- Wide layout: the `@media (min-width:768px)` block at :319. Markup: `.trmapcard` wrapper and `#tripCol` in the Trip page at :723+.
- Map frame: mapFrame / fitPts :2290, frameMapFor / legPts / placeDayPts :2870. Popups: hotelName / popPill / pinPopOpen :2750+. Map build: buildTripMap :1950, buildLOD :2010. Rail: railHtml / renderRail :2530. scrollBox / scrollToCurrentStop / segPad :2885.
- Zones: TZ_STATE / zonedToEpoch / chgTz / chgTs / chgWall :2104–2140. Trip: dayStats :2480, tripStats :2514, renderOverview :2560.
- TESTS in the repo: `NODE_PATH=$(npm root -g) node test/trip-map.test.js` (frames, popups, the side column at both widths, retired-stop markers, wording and tilde sweeps) and `test/trip-time.test.js` (zones). verify-74…verify-97 + edge are SCRATCHPAD-ONLY and die with the session. HARNESS RULE: never retype a number that also lives in index.html. v102 repointed four suites — 74 (backup dots now 0), 76 (the current card must end up in view in whatever box scrolls it, not "the page scrolled"), 78 and 80 (one Your route list, and it is Overview's).

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins), then the iPad.
- Try the new column on the real iPad, in both orientations, including the sticky picker under a rubber-band scroll.
- Keep logging the drive: sessions into CHARGES (chg-025…), receipts into EXPENSES (exp-009…); both seed Spend once by id.
- Read the footer before the next bump. This build is v102.
