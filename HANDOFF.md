# SF Move — handoff

## Status
v105 · Sep 10 · previous main head 0667691. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/*.png (acceptance shots per build; the v102-sidecol-* set shows a layout v103 reverted, kept as that build's record) + test/trip-time.test.js and test/trip-map.test.js. All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v105)
- v105 chg-027 Castaic, CA (14:23, 37.39 kWh, $17.57, 28 min) appended — 27 logged sessions, five of them on Day 5, which runs Buckeye → Quartzsite → Indio → Ontario → Castaic in time order. California time from its address, one actual Day 5 charging row in Spend. chg-025, chg-026, the Coalinga booking and exp-009 were already shipped in v104 and were left untouched.
- v104 DATA. chg-025 Indio, CA (11:00, 36.89 kWh, $16.23, 24 min) and chg-026 Ontario, CA (12:42, 31.68 kWh, $16.15, 19 min) — 26 logged sessions, four of them on Day 5, which now runs Buckeye → Quartzsite → Indio → Ontario in time order and totals 126.79 kWh · $55.66. Both take California time from their addresses.
- v104 COALINGA IS BOOKED. The `orbitz` link is gone from the STOPS entry, which is the single fact `nightsList()` reads: Hotels now says 4 of 4 booked, 0 to book, and the stop card leads with Hotel in Apple Maps. Added `maps:` (the Dorris Ave address) and `note:"Check-in 4 PM–midnight · non-refundable · Expedia #73541759098262"`; `detail`'s check-in was widened to match. The address is carried by `hotel:"Harris Ranch Inn · 24505 W Dorris Ave"` and the maps URL, NOT by a stop-level `addr` — `addr` prints on the Itinerary card, which v94 deliberately cleared of hotel prose, and the other three booked stops all use this same shape.
- v104 exp-009 ($252.74, "Harris Ranch Inn · booked Expedia · incl. $13.74 stay protection", Day 5 14:30) is the actual room. The planned `seed-h5` row is retired the same way Days 1, 2 and 3 retired theirs: dropped from `seedSpend` for fresh installs AND filtered once from an existing store behind `state.spend.hotel5BookedV1`. The planned pet fee `seed-p5` ($50) STAYS — that is what every earlier booking did, and the fee is still to come. No planned/actual double count: Day 5 has exactly one hotel row and it is actual. Hotel spend reconciles with EXPENSES at $967.65.
- v103 reverted v102's wide layout (picker and section below the map at every width; Your route back in the map card) and added the wide-only context block under Your route — `railCtx()`: Nights / Places / Today's charges, one line each, taps reusing `toggleHotel` / `openPlace` / `openCharge`. v103 also kept v102's retired-stop marker removal.
- v101/v100 chg-024 Quartzsite and chg-023 Buckeye. v99 the sub-tab owns the map frame, two-line popups, no link-announcing labels, no tildes. v98 time zones. v97 the map layer bar, the taller hero, one-line stat rows.

## Rough
- The Coalinga card note reintroduces a check-in line to an Itinerary card, which v94 had cleared. It is there because the note was specified that way; verify-89 and verify-94 now allow booking prose inside a stop's own `.note` and nowhere else on a card.
- No night is unbooked any more, so the "hollow pin" and "$X planned" paths have no subject in the current data. Those assertions are now self-locating (they derive booked state from STOPS and assert the positive when nothing is unbooked) rather than naming Coalinga.
- Buckeye sits 5.67 map units from chg-022 Chandler with CLUSTER_R 6, so those two share one badged pin though they are ~50 road miles apart.
- Spend's per-day headers each print WHOLE dollars, so six rounded headers need not sum to the rounded grand total. The invariant is per day.
- Only STOPS and charge addresses carry zones; extend TZ_STATE if the route leaves IL/MO/OK/TX/KS/NM/CO/AZ/CA/NV.
- Everything is verified only in headless Chromium. Nothing has been run on a real iPhone or iPad.

## Where things live
- Data: STOPS :1786, CHARGES :1842, EXPENSES :1874, seedSpend/`P()` :3225. One-time migrations (each behind a flag, additive) :1240–1315 — `hotel5BookedV1` retires seed-h5.
- Hotels: nightsList / hotelStats / renderHotelsSec :2790+. `booked = !!s.hotel && !/TBD/ && !s.orbitz` is the one switch.
- Wide layout: `@media (min-width:768px)` :319 (map card 70/30). Context block: railCtx / toggleHotel / openCharge after renderRail :2530.
- Zones: TZ_STATE / zonedToEpoch / chgTz / chgTs / chgWall :2104–2140. Trip: dayStats :2480, tripStats :2514.
- TESTS in the repo: `NODE_PATH=$(npm root -g) node test/trip-map.test.js` and `test/trip-time.test.js`. verify-74…verify-97 + edge + the per-build v100/v101/v104 suites are SCRATCHPAD-ONLY and die with the session. HARNESS RULE: never retype a number that also lives in index.html. v104 repointed four suites that had frozen "Coalinga is not booked" — verify-89, verify-94, verify-95 and edge2 now all derive booked state from STOPS.

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins), then the iPad.
- Confirm the Harris Ranch pet fee when it lands, and retire `seed-p5` the way the room row went.
- Keep logging the drive: sessions into CHARGES (chg-028…), receipts into EXPENSES (exp-010…); both seed Spend once by id.
- Read the footer before the next bump.
