# SF Move HQ — handoff

**Status: v114 · Sep 11 · previous main head eda13fe.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v114)
- Appended **`fastrak-tag`** ("Get a FasTrak toll tag for the bridges") to the After Landing card in `PHASES`.
- **No migration, and none was needed — checked, not assumed.** Move-tab checklists are *not* seeded into
  the store: `renderMove` walks the `PHASES` constant on every render and the store keeps only `done[id]`
  (plus the device's own `customTasks[card]`). So a new item reaches every populated device the moment it
  ships, unchecked, with no flag to consume. Contrast Spend, where `seedPlaces`/`seedCharges` copy rows
  into the store once and later edits DO need a flagged migration (see v113). `state.removed` is Sort-only.
- Proven on a populated store in `test/move-seeds.test.js`: neighbour ticked, custom task on the card, the
  item renders once, unchecked, count 2 → 3, header "1/3", nothing written to `done`. Shots at 390 and 1194
  in `design/verify/v114-fastrak-*.png`.

## Where things are (index.html)
- `PHASES` ~866 (Move cards; After Landing is `id:"landing"` ~928) · `renderMove` ~1379 · `EXTRA` link chips.
- `PLACES` ~1924 · `CHARGES` ~1876 · `EXPENSES` ~1904 · `LIFETIME` ~1901 (read-only).
- `seedPlaces` ~3455 · `seedCharges` ~3426 · `seedExpenses` ~3439 · `seedSpend` ~3335 · `placeTown` ~3450.
- Migrations ~1200–1345, `pl002CostFixV1` last. **New ones go at the END, behind a NEW flag** — editing an
  already-flagged block is a no-op on every device that consumed the flag (how `seed-h3` survived).
- `pinClusters` ~2872 · `mapMode` ~2621 (layer keys `route` `chg` `places` `life` `hotel`) · footer ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js`, **`test/move-seeds.test.js`** (new; also writes the
  verify shots). Sweep: `scratchpad/sweep.sh` — **39 suites green**.
- **HARNESS RULE:** never retype a number that also lives in index.html — derive from the source arrays,
  assert the delta, or assert structure. Locate pins **by id**, never by a screen-pixel radius. Group headers
  are `.grp-h`, CSS-uppercased — match case-insensitively. The Move card count span `.sec-head .m` also
  holds the ▼ chevron — strip it before comparing.
- verify-77 intermittently reports NO RESULT inside the sweep and passes standalone — runner flake.

## Next
Nothing outstanding.
