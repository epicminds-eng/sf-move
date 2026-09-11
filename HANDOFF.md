# SF Move — handoff

## Status
v109 · Sep 10 · previous main head 798a929. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/*.png (acceptance shots per build; the v102-sidecol-* set shows a layout v103 reverted, kept as that build's record) + test/trip-time.test.js and test/trip-map.test.js. All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v109)
- v109 chg-028 Tejon Ranch, CA (15:36, 28.67 kWh, $12.61, 20 min) and chg-029 Tesla Oasis · Lost Hills, CA (16:49, 20.72 kWh, $9.11, 14 min) appended — 29 logged sessions, seven on Day 5, now Buckeye → Quartzsite → Indio → Ontario → Castaic → Tejon Ranch → Tesla Oasis in time order. chg-029 FULFILLS the long-standing planned `chg-oasis` entry at the same Lost Hills coordinates, under a NEW id (per the brief) rather than in place — so chg-oasis was RETIRED (dropped from CHARGES entirely, not just flagged) rather than edited. Result: zero planned chargers remain, one real filled pin at Lost Hills (no leftover hollow "planned" marker), no Spend row for the retired entry, no double count. Six scratchpad suites (verify-74/75/79/83/84/86/92/96) had hardcoded "exactly one planned charger = the Oasis"; all now derive the expected planned count from `CHARGES.filter(c=>c.planned).length` instead of assuming 1. `test/trip-time.test.js`'s CA-timezone check moved from the retired `chg-oasis` to `chg-029`, same address, same assertion.
- v108 THE CHARGING COLUMN reads time, not energy. Its Trip strip is stops · AT CHARGERS · spend — the middle cell is literally the expression the Charging section's "at chargers" tile renders (`real.length?hm(t.chMin):"—"`), so the two can never disagree; kWh is gone from the strip. Today's charges rows read "<min> min · $<cost>" on the right; left side (name · station clock) unchanged. Column strip value size stepped from --t-value to --t-row for the 63px cell at 768.
- v107 THE WIDE COLUMN FOLLOWS THE SUB-TAB, nothing below the map moved. `railCol()` picks the column's content: Overview is Your route alone; every other sub-tab is a three-number `statrow` strip plus a one-line list (`colSec`/`colRow`, existing `grp`/`row` styling). Daily is TODAY ONLY (Rolled, each charge/place in time order, tonight's hotel, ETA); Charging/Places/Hotels/Itinerary each get a strip + list. Taps reuse `openCharge`/`openPlace`/`openHotelPin`/`toggleHotel`/`[data-stop]`. `todayFigures()` was extracted so the strip under the map and the Daily column read one computation — the column deliberately MIRRORS numbers also shown below the map at this width; verify-78's duplicate audit reads the map card WITHOUT the column to allow it.
- v106 THE LIFETIME LAYER MERGES THE TRIP LOG via `lifeRows()` (LIFETIME + non-planned CHARGES, de-duped on date+time) — the one input to `lifeClusters()`/`lifeSummary()`. LIFETIME itself is never written to; trip totals still count CHARGES alone. Caches (`LIFE_CL`/`LIFE_SUM`) drop whenever CHARGES changes. Also widened `--t-value-lg`'s clamp floor 19px→17px so "10h 08m" fits a 4-up stat row at 320.
- v103–v105: reverted v102's wide layout then rebuilt it properly as the column above; Coalinga booked (Harris Ranch Inn, Expedia #73541759098262, exp-009 $252.74 replaces the planned room row); chg-023…027 appended. v99 the sub-tab owns the map frame, two-line popups, no link-announcing labels, no tildes. v98 time zones. v97 the map layer bar, the taller hero, one-line stat rows.

## Rough
- No planned charger remains in CHARGES at all now (the Oasis was the last one). If a future planned charger is added, re-check that the six repointed suites' `d.planned`/`chg.planned` fields still resolve — they read `CHARGES.filter(c=>c.planned).length` live, so they should, but they were only ever exercised against exactly 0 or 1.
- No night is unbooked any more, so the "hollow pin" and "$X planned" hotel paths have no subject in the current data; those assertions are self-locating (derive booked state from STOPS, assert the positive when nothing is unbooked).
- Buckeye sits 5.67 map units from chg-022 Chandler with CLUSTER_R 6, so those two share one badged pin though they are ~50 road miles apart.
- Spend's per-day headers each print WHOLE dollars, so six rounded headers need not sum to the rounded grand total. The invariant is per day.
- Only STOPS and charge addresses carry zones; extend TZ_STATE if the route leaves IL/MO/OK/TX/KS/NM/CO/AZ/CA/NV.
- Everything is verified only in headless Chromium. Nothing has been run on a real iPhone or iPad.

## Where things live
- Data: STOPS :1786, CHARGES :1842 (now ends chg-029, no planned entries), EXPENSES :1874, seedSpend/`P()` :3225.
- Lifetime: lifeRows/lifeClusters/lifeSummary :2715+. Hotels: nightsList/hotelStats/renderHotelsSec :2790+.
- Wide column: `@media (min-width:768px)` :319; railCol/colSec/colRow/colDaily/colCharging/colPlaces/colHotels/colItinerary after renderRail :2530+.
- Zones: TZ_STATE/zonedToEpoch/chgTz/chgTs/chgWall :2104–2140. Trip: dayStats :2480, tripStats :2514, todayFigures :2745.
- TESTS in the repo: `node test/trip-map.test.js` and `node test/trip-time.test.js` (both `NODE_PATH=$(npm root -g)`, Chromium at /opt/pw-browsers/chromium). verify-74…verify-97 + edge + the per-build v100/v101/v104/v109 suites are SCRATCHPAD-ONLY and die with the session. HARNESS RULE: never retype a number that also lives in index.html — v109 repointed six suites that hardcoded "the Oasis is the one planned charger" to instead read `CHARGES.filter(c=>c.planned).length`.

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins), then the iPad.
- Keep logging the drive: sessions into CHARGES (chg-030…), receipts into EXPENSES (exp-010…); both seed Spend once by id.
- Read the footer before the next bump.
