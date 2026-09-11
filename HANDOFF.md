# SF Move HQ — handoff

**Status: v115 · Sep 11 · previous main head 361a220.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v114 → v115, two commits)
- **v114** appended `fastrak-tag` to the After Landing card in `PHASES`. No migration and none needed:
  Move checklists are read from the constant every render, the store keeps only `done[id]`. Proven on a
  populated store in `test/move-seeds.test.js`; shots `design/verify/v114-fastrak-*.png`.
- **v115** appended **`chg-032` Pleasanton, CA** (Sept 11 07:38, 30.5787 kWh, $14.67, 14 min) — the first
  **Day 6** session. tz derives from the address (`America/Los_Angeles`). Nothing else in CHARGES touched.
  CHARGES now holds **32 logged sessions** (chg-001..032, contiguous, zero planned) — the brief said 30;
  32 − 2 is the mirrored Harris Ranch pair chg-030/031, the likely gap. Day 6 has one stop. It seeds one
  Day 6 charging row on Spend and reaches Lifetime through `lifeRows()` (export ends Sept 9, no de-dupe).
- The map test's session count is now **structural**: logged count must equal the last id's number with no
  gaps — a lost or doubled entry fails it, and no literal has to be retyped when the next session lands.
- The Charging strip's first cell is `real.length` labelled **"stops"** — that is the on-screen session count.
  The test reads that cell and compares it to CHARGES rather than retyping 30 as an expectation of the UI.

## Where things are (index.html)
- `CHARGES` ~1876–1904 (append at the end) · `LIFETIME` ~1905 (read-only) · `lifeRows` ~2817 · `PLACES` ~1925.
- `PHASES` ~866 (Move cards) · `renderMove` ~1379 · `renderChargingSec` ~3184 · `renderSpendDays` ~3541.
- `seedCharges` ~3427 · `seedPlaces` ~3456 · `seedExpenses` ~3440 · `dayForDate` ~3710 · `TRIP_DAYS` ~3334.
- Migrations ~1200–1345, `pl002CostFixV1` last. **New ones go at the END, behind a NEW flag** — editing an
  already-flagged block is a no-op on every device that consumed the flag (how `seed-h3` survived). Spend
  seeds only ever ADD rows, so editing a shipped amount needs a migration too (v113).
- `pinClusters` ~2873 · `mapMode` ~2622 (layer keys `route` `chg` `places` `life` `hotel`) · footer ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js` (now ends with a chg-032 block at 390 and 1194 that
  also writes `design/verify/v115-pleasanton-*.png`), `test/move-seeds.test.js`. Sweep: `scratchpad/sweep.sh`,
  **39 suites**.
- **HARNESS RULE:** never retype a number that also lives in index.html — derive from the source arrays,
  assert the delta, or assert structure. Locate pins **by id**, never by a screen-pixel radius. Group headers
  are `.grp-h`, CSS-uppercased — match case-insensitively. `.sec-head .m` also holds the ▼ chevron.
- verify-77 intermittently reports NO RESULT inside the sweep and passes standalone — runner flake.

## Next
Nothing outstanding. Day 6 (SF) has no rolled/arrived stamps yet, so it stays out of the averages.
