# SF Move HQ — handoff

**Status: v120 · Oct 7 · previous main head 76c67c7. TRIP COMPLETE AND CLOSED OUT (arrived Sept 11 9:11 AM);
Spend has no planned rows; Move close-out applied.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state or the repo.

## Exports
- **Exports are never committed (public repo — they carry the garage code and sync credentials); the canonical
  final export lives in iCloud.** `data/` is in `.gitignore` so one can never land by accident.
  `data/lifetime-charges.json` was tracked before the rule and stays tracked (ignore rules never untrack).

## This session (v120) — Move close-out
- **`postMoveCloseoutV1`** (last in the migration run, top-level flag): ticks `addr-changes`, `ipass`,
  `drive-budget`, `deposit`; deletes orphan `done[]` keys `jh-plan`, `jh-labels` (seed items removed in
  v118) and `car`. Runs once; a reload is asserted to change nothing.
- Logistics: `car` split into **`car-insurance`**, **`car-license`**, **`car-reg`** — new ids, nothing
  inherited, all unticked. The CA DMV / Covered California pills stay. `assess-furniture` description now
  reads "4 weeks in as of Oct 9 — list what's actually missing".
- Move header subtitle shows the build (`· v120`), read off the footer at render so the two cannot disagree.
- `greek-night.html` (Oct 1 Greek Theatre plan) landed on main from another session — a separate page with its
  own versioning rule in CLAUDE.md; it shares nothing with index.html.

## Where things are (index.html)
- Migrations ~1200–1361, `postMoveCloseoutV1` last. **New ones go at the END, behind a NEW flag** — an
  already-flagged block is a no-op on every device that consumed it. Spend seeds only ADD rows.
- `PHASES` ~866 (`logistics` ~915, `landing` ~929, `joey` ~893) · `EXTRA` ~1135 · `renderMove` ~1392 ·
  `renderDates` ~1380 (sets `#moveSub`) · `spendTotals` ~3395 · `STOPS` ~1850 · `CHARGES` ~1894 · footer ~853.

## Tests
- Repo: `test/move-seeds.test.js` (FasTrak; garage code + SF Setup; post-move close-out + idempotence, writes
  `design/verify/v120-move-*.png` with `SHOTS=1`), `test/spend.test.js`, `test/trip-time.test.js`,
  `test/trip-map.test.js` — 69 · 72 · 48 · 146, all green at v120. The scratchpad sweep is gone (restart).
- **HARNESS RULE:** never retype a number that also lives in index.html — derive, assert the delta, or
  assert structure. Locate pins **by id**. `.sec-head .m` also holds the ▼ chevron.

## Next
Nothing outstanding. The move continues in SF Setup.
