# SF Move HQ — handoff

**Status: v119 · Sep 24 · previous main head a0489f4. THE TRIP IS COMPLETE AND CLOSED OUT — arrived 1442A
Grove St Sept 11 9:11 AM; Spend has NO planned rows.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state or the repo.

## This session (v119) — projected = spent once the trip is done
- `spendTotals` added `MISC_TAIL` (and the remaining-miles charging and remaining-days food extrapolations)
  unconditionally, so the finished trip read projected $40 above spent. Now `done = arrived[last stop]` —
  the same value `tripProgress`/`dayProg`/`dayStatus` read — zeroes the tail and both extrapolations. No
  flag, no string: the Spend hero and the Trip figure both read `spendProj()`, so both agree by construction.
- Under way, nothing changed: projected still exceeds spent by tail + extrapolations + planned.
- `spendTotals` now also returns `foodEst`, `tail`, `done` so a test can assert the composition, not a number.
- v118 (previous commit) closed Spend out: no planned rows; Ship Sticks gone; seeds land a fresh install in
  the same state as `spendCloseoutV1` leaves a device (seeds run AFTER init migrations — hence seeds changed).

## Where things are (index.html)
- Migrations ~1200–1362, `spendCloseoutV1` last. **New ones go at the END, behind a NEW flag** — an
  already-flagged block is a no-op on every device that consumed it. Spend seeds only ADD rows.
- `retirePlanned`/`retireRow` ~1311 · `seedSpend` ~3372 · `spendTotals` ~3380 (`soFar` actual, `proj`, `done`,
  `tail`; `spendProj()` is the ONE projected total) · `entrySource` ~3494 · `PHASES` ~866 (`joey` ~893) · `EXTRA` ~1135.
- `STOPS` ~1835 · `CHARGES` ~1879 · `PLACES` ~1928 · footer ~853.

## Tests
- Repo: `test/spend.test.js` (close-out on a fresh + real-export-shape store; projected = spent on the completed
  store, projected > spent on an under-way one; two reloads), `test/trip-time.test.js`,
  `test/trip-map.test.js`, `test/move-seeds.test.js` — 72 · 48 · 146 · 47, all green at v119. Shots only with
  `SHOTS=1`. **The 36-suite scratchpad sweep is GONE** — a session restart wiped the scratchpad and those
  suites were never in the repo. The four repo tests are the record now; anything worth keeping goes in `test/`.
- **HARNESS RULE:** never retype a number that also lives in index.html — derive, assert the delta, or
  assert structure. Locate pins **by id**. `.sec-head .m` also holds the ▼ chevron.

## Next
Nothing outstanding. The move continues in the SF Setup app.
