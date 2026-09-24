# SF Move HQ — handoff

**Status: v118 · Sep 24 · previous main head 315750c. THE TRIP IS COMPLETE AND CLOSED OUT — arrived 1442A
Grove St Sept 11 9:11 AM; Spend has NO planned rows.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state or the repo.

## This session (v118) — Spend close-out, one commit
- **`spendCloseoutV1`** (last in the migration run, new flag): pet fees `seed-p2/p3/p5` and tolls `seed-t1/t2`
  still planned → actuals at their planned amount (id, category, day, label kept; `billsLater` cleared). A
  row already confirmed by hand is not planned, so it is untouched. `retireRow("seed-m0")` — Ship Sticks
  never happened. `"Watter"` @ $18.72 → `"Water"` (name + amount match, no-op if absent).
- **Seeds changed — that is the fresh-install path chosen.** `seedSpend` runs on the first Spend render,
  AFTER the init migrations, so a flag alone would have seeded planned rows behind an already-consumed flag.
  Now pet fees/tolls seed as actuals and `seed-m0` does not seed; fresh and migrated stores end identical.
- Joey Handoff: `jh-plan` and `jh-labels` (Ship Sticks) removed; the `EXTRA.joey` Ship Sticks refblock
  (title, pickup/delivery addresses, Book button) removed. The other six items and `done[id]` untouched.
- Also touched, deliberately: the Day-0 `gear-decisions` label said "car-vs-Ship Sticks" → "car-vs-ship"
  (the verify demands no Ship Sticks anywhere on Move). And `entrySource` captioned any seed row "Planned"
  by id prefix, so a converted row would still have read Planned — now "At planned amount" once it is actual.

## Where things are (index.html)
- Migrations ~1200–1362, `spendCloseoutV1` last. **New ones go at the END, behind a NEW flag** — an
  already-flagged block is a no-op on every device that consumed it. Spend seeds only ADD rows.
- `retirePlanned`/`retireRow` ~1311 · `seedSpend` ~3372 · `spendTotals` ~3380 (`soFar` = actual total,
  `plHotelPet`+`plOther` = planned) · `entrySource` ~3494 · `PHASES` ~866 (`joey` ~893) · `EXTRA` ~1135.
- `STOPS` ~1835 · `CHARGES` ~1879 · `PLACES` ~1928 · footer ~853.

## Tests
- Repo: `test/spend.test.js` (new: fresh store + real-export-shape store with a hand-confirmed fee and a
  "Watter" row; delta in `soFar` derived from the fixture; two reloads), `test/trip-time.test.js`,
  `test/trip-map.test.js`, `test/move-seeds.test.js` — 50 · 48 · 146 · 47, all green at v118. Shots only with
  `SHOTS=1`. **The 36-suite scratchpad sweep is GONE** — a session restart wiped the scratchpad and those
  suites were never in the repo. The four repo tests are the record now; anything worth keeping goes in `test/`.
- **HARNESS RULE:** never retype a number that also lives in index.html — derive, assert the delta, or
  assert structure. Locate pins **by id**. `.sec-head .m` also holds the ▼ chevron.

## Next
Nothing outstanding. The move continues in the SF Setup app.
