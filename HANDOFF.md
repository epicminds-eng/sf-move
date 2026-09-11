# SF Move HQ — handoff

**Status: v112 · Sep 11 · previous main head 814141b.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v112)
- Appended **`pl-002`** Prime Steakhouse at Harris Ranch ($146.44, 20:44, Sept 10). Seeds one actual Day 5
  food row via `seedPlaces`, same mechanism as `pl-001` Rudy's. Draws a fork pin on the Places layer and
  files under "Day 5 · Coalinga". Nothing else touched.
- **`kind` is a closed vocabulary — `food` | `coffee` | `sight`.** It picks the list glyph, the map glyph and
  the Spend category; anything outside it silently falls back to the "sight" star. The human descriptor goes
  in `note` (Rudy's carries "Texas BBQ" there). So "Steakhouse" is `note`, not `kind` — which is also the
  only way to get the asked-for Spend note, since `seedPlaces` builds it as `name · note`.
- **`placeTown` splits `addr` on commas** and wants `street, city, STATE zip`. The comma-less CHARGES
  spelling made the row read "Coalinga CA 93210"; added the city/state comma so it reads "Coalinga, CA".
- The order itself rides on `detail` (a field STOPS already uses). Like `chg-031.note`, **it renders nowhere**.
- **Open question for Chad:** the order note says $128.44 + $28 tip = $156.44, but the amount is $146.44.
  Shipped $146.44 as specified — the components are $10 apart from the total, so one of them is wrong.

## Where things are (index.html)
- `PLACES` ~1919 (append at the end) · `CHARGES` ~1875 · `EXPENSES` ~1903 · `LIFETIME` ~1900 (read-only).
- `seedPlaces` ~3450 · `seedCharges` ~3421 · `seedExpenses` ~3434 · `seedSpend` ~3330.
- `placeTown` ~3445 · `PLACE_G`/`GLYPH` ~2796 · `renderPlacesSec` ~2461 · `pinClusters` ~2867 · `mapMode` ~2616
  (layer keys: `route` `chg` `places` `life` `hotel` — it is **`places`**, not `place`).
- Migrations ~1200–1345 (new ones go at the END, behind a NEW flag). Footer version line ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js`. Sweep: `scratchpad/sweep.sh` — **37 suites green**.
- **HARNESS RULE:** never retype a number that also lives in index.html — reconcile from the source arrays,
  assert the delta, or assert structure. Locate pins **by id**, never by a screen-pixel radius. Group headers
  are `.grp-h`, a sibling *before* `.grp`, and CSS uppercases them — match case-insensitively.
- verify-77 occasionally reports NO RESULT inside the sweep but passes standalone — runner flake, not a fail.

## Next
Nothing outstanding beyond the $146.44 / $156.44 discrepancy above.
