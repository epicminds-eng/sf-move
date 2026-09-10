# SF Move — handoff

## Status
v98 · Sep 10 · previous main head 542ed6c. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/v97-trip.png + test/trip-time.test.js (the FIRST assertions to live in the repo rather than the scratchpad). All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v98)
- v98 TIME ZONES. The drive crosses four of them and every stamp is stored as a zone-less wall clock, so `arrived − rolled` was subtracting clocks from different zones: Day 3 (Amarillo CDT → Holbrook MST) read 8h 30m instead of 10h 30m, and that two-hour hole ran straight into door-to-door, average speed, hours a day, minutes per mile and the ETA. Now: every STOPS row carries an IANA `tz`; `zonedToEpoch(wallClock, tz)` solves for the instant whose local time in that zone is that wall clock (Intl.DateTimeFormat + formatToParts, one guess and one correction so a DST edge settles — no library, no offset table, and it falls back to the device zone on an engine with no IANA support); `TZ_STATE` maps a US state to a zone and `tzForAddr` reads the state out of a charge's address, so CHARGES take the station-local zone from their own data. dayStats reads `rolled[stopId]` in the PREVIOUS stop's zone (that is where the morning happened) and `arrivedAt[stopId]` in that stop's, exposing `rolledT`/`arrivedT` alongside the wall-clock `rolled`/`arrived`; span and the charger-overlap window use the instants. Measured blast radius on the real store: Day 3 door-to-door 565→685 min, moving 419→539, average 74.2→57.7 mph (the 74.2 was the artefact); trip pace 1.183→1.26 min/mi, hours a day 4.99→5.31, ETA 20 min later; Days 1, 2 and 4 never leave one zone and are byte-identical.
- NOTHING THE USER READS MOVED, and nothing stored changed shape. Stamps are still written by localISO as wall clock and still displayed from it. `chgTs(c)` is now the INSTANT (ordering + overlap); `chgWall(c)` is the old wall-clock value and is what every display site and every seeded Spend `ts` uses, so old and new rows in an existing store still read alike. No migration, no new state key.
- v97 before it: the map layer control became a full-width bar flush across the bottom of the hero (`--seg-n` fractions, height `var(--s7)`), the hero grew 30% via `MAP_TALL=1.3` on the fitted crop, and every Trip stat row went to `repeat(var(--n),1fr)` — one line, bottom-aligned, never ellipsized, whole dollars.
- v83–v96: chg-013…chg-022, Day 3 arrival + Holbrook hotel/Safeway, Day 5 restructured to Coalinga, horizontal-pan and empty-header fixes, the token system and one fluid layout, the three-line progress card, the lifetime charging layer, the Hotels section and map layer.

## Rough
- Only STOPS and charge addresses carry zones. A PLACE with no address falls back to its day's stop zone; a charge in a state outside TZ_STATE (IL/MO/OK/TX/KS/NM/CO/AZ/CA/NV) falls back the same way, then to the device zone. Extend TZ_STATE if the route ever leaves those states.
- STAT MATH: dayStats separates chMin (ALL the day's charging minutes) from chDrive (each session's OVERLAP with rolled → arrived), clamped to 0 when a session outlasts door-to-door, so an evening top-up cannot inflate average speed.
- Everything is verified only in headless Chromium. Nothing has been run on a real iPhone: tab-bar detach, date picker, clipboard, share sheet, geolocation, the standalone PWA shell.
- The container's fallback font is WIDER than SF Pro, so the 320px fit margins in verify-97 are pessimistic — a real iPhone has more room.
- A few LOD town labels and one pin halo sit outside the crop horizontally. Pre-existing; verify-97 reconciles the set rather than asserting zero.
- Map LOD collision uses estimated text boxes, not getBBox (the Trip page is display:none at init), so a near-miss can still touch.
- A Reset or double-tap takes ~1.2 s to settle on 1×; until it lands the map keeps touch-action:none.
- A seeded charge or expense keeps its day/stopId if departDate changes later. Mom's auto-arrive radius is ~5 mi around 33.22721,-111.88610.

## Where things live
- State init + migrations (additive, each behind a one-time flag): index.html:938–986. Change tracking in commit()/save()/saveSeed(); SYNC_SKIP and ID_ARRAY govern what merges.
- Zones: TZ_STATE / zonedToEpoch / tzForAddr / stopTz / rolledTz / chgTz / chgTs / chgWall :2104–2138, immediately above dayStats' callers. STOPS carry `tz` :1785.
- Trip: renderTrip :1497, map LOD :1775, VB_ROUTE/VB_LIFE/MAP_TALL :2190, dayStats :2444, tripStats :2478, statrow() :2869, renderHotelsSec :2975.
- Other tabs: renderMove :1110, renderSort :1189, renderPack :1340, renderSpend :2590+, tabs :3030.
- TESTS: `NODE_PATH=$(npm root -g) node test/trip-time.test.js` drives the app's own dayStats in Chromium (/opt/pw-browsers/chromium) and asserts Day 3 = 10h 30m, Day 5 unshifted, the zone offsets, and that no displayed clock moved. The older verify-74…verify-97 + edge suites are still SCRATCHPAD-ONLY and die with the session. HARNESS RULE: never retype a number that also lives in index.html. v98 applied it twice — verify-86 and verify-91 no longer compare against a frozen older build (v85/v90), they lift the post-arrival top-ups out of CHARGES in the SAME build and compare against that.

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins), then the iPad. Real GitHub API behaviour (ETag on PATCH, rate limits) is unverified.
- Test on the actual iPhone/iPad as a standalone PWA, including the bottom map bar over the map's own pan gestures.
- Keep logging the drive: sessions into CHARGES (chg-023…), receipts into EXPENSES (exp-009…); both seed Spend once by id.
- Version numbering drifted twice (v96 and v97 were each asked for after they had shipped): this build is v98. READ THE FOOTER before the next bump.
