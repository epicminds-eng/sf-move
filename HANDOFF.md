# SF Move HQ — handoff

**Status: v116 · Sep 11 · previous main head 8790186. THE TRIP IS COMPLETE.** Single-file PWA, `index.html`,
no build, no CDN. localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in
app state, never in the repo.

## This session (v116)
- **`sfArrivedV1`** — arrived 1442A Grove St, Sept 11 **9:11 AM Pacific**. Sets `arrivedAt.sf="2026-09-11T09:11"`
  unconditionally (over a hand-tapped stamp too, so door-to-door uses 9:11) and marks every stop arrived.
  **That block IS the seed default:** `trip.arrived` starts `{}` and the flagged backfills fill it — there is
  no separate defaults object. `STOPS` is assigned later in the file, so the ids are literal there.
- **Every "done" renders from that one stamp.** `arrived.sf` → `tripProgress` (miles = TOTAL_MI, 2,556 logged,
  0 to go), `dayProg().done` → strip "arrived", `dayStatus(6)` → Done pill, Your Route → Arrived. No
  hard-coded "complete" strings existed and none were added.
- **Why the other stops are marked too:** a fresh install had `arrived` only for the three backfilled nights,
  so Days 4–5 would read Planned under a finished trip. Reaching the last stop implies reaching all of them.
- **Day 6 door-to-door on a fresh install is "—"**: there is no Day 6 *roll* stamp to compute from and none
  was invented. A device that tapped Rolling computes it from 9:11 (tested with a 06:40 fixture roll).

## Where things are (index.html)
- Migrations ~1200–1348, `sfArrivedV1` last. **New ones go at the END, behind a NEW flag** — an already-
  flagged block is a no-op on every device that consumed it. Spend seeds only ADD rows (edit ⇒ migrate).
- `tripProgress` ~2142 · `dayProg` ~2615 · `dayStatus` ~3110 · `todayFigures`/`renderTripStrip` ~2787.
- `STOPS` ~1832 (sf is last, `off:5`; `TRIP_DAYS` = 6) · `CHARGES` ~1876 · `PLACES` ~1925 · `PHASES` ~866.
- `EXTRA` ~1135 (per-card HTML: `joey`, `logistics`, `landing`, `ref`) · `renderMove` ~1379 · footer ~850.

## Tests
- Repo: `test/trip-time.test.js` (now ends with the SF-arrival block: fresh store + pre-tapped store, 390 and
  1194), `test/trip-map.test.js`, `test/move-seeds.test.js`. Sweep: `scratchpad/sweep.sh`, **39 suites**.
  Verify shots write only with `SHOTS=1` (`design/verify/v116-arrived-*.png`).
- **HARNESS RULE:** never retype a number that also lives in index.html — derive from the source arrays,
  assert the delta, or assert structure. Locate pins **by id**. `.sec-head .m` also holds the ▼ chevron.
- verify-77 intermittently reports NO RESULT inside the sweep and passes standalone — runner flake.

## Next
Reference-card garage code field + SF Setup link pill (commit 2 of this pair).
