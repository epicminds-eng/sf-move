# SF Move HQ — handoff

**Status: v113 · Sep 11 · previous main head 320d872.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v113)
- **`pl-002` cost 146.44 → 156.44**, the real check ($128.44 + $28 tip). Corrected in two places, because
  they are two different readers: `PLACES` ships the new total so a **fresh install** seeds it correctly, and
  **`pl002CostFixV1`** rewrites the row on a store that already seeded the old one.
- **Why the migration is needed at all:** `seedPlaces`/`seedCharges`/`seedExpenses` only ever *add* a row
  they do not already have. They never reconcile an existing row against its source, so changing a seed
  constant is invisible to every established store. Any future edit to a shipped `cost`/`amount` needs the
  same pairing — change the constant *and* migrate — or the phone and a fresh install will disagree.
- The migration is guarded on the old value (`amount===146.44`), so an amount edited by hand stands.
- The `detail` receipt now reads "$128.44 + $28 tip = $156.44" and reconciles. It still renders nowhere.

## Where things are (index.html)
- `PLACES` ~1923 · `CHARGES` ~1875 · `EXPENSES` ~1903 · `LIFETIME` ~1900 (read-only, never in trip totals).
- `seedPlaces` ~3454 · `seedCharges` ~3425 · `seedExpenses` ~3438 · `seedSpend` ~3334 · `placeTown` ~3449.
- Migrations ~1200–1345, `pl002CostFixV1` last. **New ones go at the END, behind a NEW flag** — editing an
  already-flagged block is a no-op on every device that consumed the flag (that is how `seed-h3` survived).
- `PLACE_G`/`GLYPH` ~2800 · `renderPlacesSec` ~2461 · `pinClusters` ~2871 · `mapMode` ~2620
  (layer keys `route` `chg` `places` `life` `hotel` — it is **`places`**, not `place`).
- `dayStats`/`tripStats` ~2500 · `MAX_DAY_MIN` ~2781 · footer version line ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js`. Sweep: `scratchpad/sweep.sh` — **38 suites green**.
  `v113.js` runs three stores: one holding the wrong total, one edited by hand, and a fresh install.
- **HARNESS RULE:** never retype a number that also lives in index.html — reconcile from the source arrays,
  assert the delta, or assert structure. Locate pins **by id**, never by a screen-pixel radius. Group headers
  are `.grp-h`, a sibling *before* `.grp`, and CSS uppercases them — match case-insensitively.
- verify-77 intermittently reports NO RESULT inside the sweep and passes standalone — runner flake.

## Next
Nothing outstanding.
