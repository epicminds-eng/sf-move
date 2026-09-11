# SF Move HQ — handoff

**Status: v110 · Sep 11 · previous main head 7a9ff8c.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v110)
- **`day1ArrivedFixV1`** — Day 1's arrival was stamped `2026-09-07`, a day late, so the span from the Sept 6
  roll ran past `MAX_DAY_MIN` and the day was rejected: it never counted toward Pace or any average. The
  migration rewrites the **date only**, keeping the stored wall clock. A stamp already on Sept 6 is untouched.
- **`seedH3RetireV1`** — drops `seed-h3` outright and sweeps `seed-h1/h2/h5` by id.
- **Diagnosis, plainly:** the four hotel-retire steps *already* filtered by id. `seed-h3` survived because
  `day3HotelV1` was set by a build that predates its retire line, so the flag short-circuited the block that
  later grew that line. Same trap catches `seed-h5` on a store that never ran `day5CoalingaV1`. Retiring is
  now one shared helper — `retirePlanned(id)` / `retireRow(id)` — so the rule has a single home.
- **Trap to remember:** adding a line inside an already-flagged migration block is a no-op on every device
  that consumed the flag. A behaviour change needs a NEW flag, not an edit to an old block.

## Where things are (index.html)
- Migrations: ~1200–1340, in dependency order. New ones go at the END of that run, behind a new flag.
- `dayStats` / `tripStats` ~2496; `MAX_DAY_MIN` ~2777. `seedSpend` ~3330; `seedExpenses` ~3434 (EXPENSES ~1903).
- `STOPS` ~1808 (every stop carries `tz`); footer version at line ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js`.
- Scratchpad sweep: `scratchpad/sweep.sh` — **35 suites, all green at v110**. `v110.js` builds three stores
  (broken device, hand-corrected device, fresh install) from the shipped seeds and asserts Day 1 = 9h 00m and
  computing, Pace "over 4 completed days", and no planned hotel row on any day that has an actual.
- **HARNESS RULE:** never retype a number that also lives in index.html. Reconcile from the source arrays,
  assert the delta a change causes, or assert structure/behaviour. Fixture inputs use obviously-fake values.
- verify-77 occasionally reports NO RESULT inside the sweep but passes standalone — runner flake, not a fail.

## Next
Nothing outstanding. Day 5 (Coalinga) has no stamps yet, so it is correctly excluded from the averages.
