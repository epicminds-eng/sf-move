# SF Move HQ — handoff

**Status: v117 · Sep 11 · previous main head 8790186. THE TRIP IS COMPLETE — arrived 1442A Grove St,
Sept 11 9:11 AM Pacific.** Single-file PWA, `index.html`, no build, no CDN. localStorage key `sfMoveApp_v1`.
Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session — two commits
- **v116 `c04cb6c` — the arrival. This is the hash Mile Marker 2.3 pins.** `sfArrivedV1` sets
  `arrivedAt.sf="2026-09-11T09:11"` unconditionally and marks every stop arrived. That block IS the seed
  default (`trip.arrived` starts `{}`; the flagged backfills fill it). Every finished-trip state derives from
  that flag — `tripProgress` (2,556 logged, 0 to go), `dayProg().done` (strip "arrived"), `dayStatus(6)`
  (Done pill), Your Route. A fresh install has no Day 6 roll stamp, so its door-to-door stays "—".
- **v117 — Reference card `Garage code` field + After Landing `SF Setup` pill.**
  - The field is **store-only by design**: `ref.garageCode` in `sfMoveApp_v1`, typed on device, saved on
    change/blur, carried by Export and gist sync like any leaf. **The repo is public — no code value is ever
    in index.html**, and the test greps the source for the value it types and expects NOT to find it.
  - The Reference card had no address on it; a `Home` line (1442A Grove St) now sits above the facts with
    the field beside it, reusing the `.addr` block the Joey card already uses. Same input rules as the ✎ note
    editors; `inputmode="numeric"`, tabular figures.
  - `SF Setup` → https://epicminds-eng.github.io/sf-setup/ is one more `a.btn` on the existing Links block.

## Where things are (index.html)
- Migrations ~1200–1348, `sfArrivedV1` last. **New ones go at the END, behind a NEW flag.** Spend seeds only
  ADD rows, so editing a shipped amount needs a migration too (v113).
- `state.ref` init ~1216 · `EXTRA` ~1135 (`ref` carries the address + field; `landing` the pills) ·
  `renderMove` ~1379 (binds `#garageCode`) · `.addr .garage` CSS ~132.
- `tripProgress` ~2145 · `dayProg` ~2618 · `dayStatus` ~3113 · `STOPS` ~1835 · `CHARGES` ~1879 · footer ~850.

## Tests
- Repo: `test/trip-time.test.js` (SF arrival, fresh + pre-tapped, 390/1194), `test/trip-map.test.js`,
  `test/move-seeds.test.js` (FasTrak; garage code + SF Setup). Sweep: `scratchpad/sweep.sh`, **39 suites**.
  Verify shots write only with `SHOTS=1` (`design/verify/v116-arrived-*`, `v117-garage-*`).
- **HARNESS RULE:** never retype a number that also lives in index.html — derive, assert the delta, or
  assert structure. Locate pins **by id**. `.sec-head .m` also holds the ▼ chevron.
- verify-77 intermittently reports NO RESULT inside the sweep and passes standalone — runner flake.

## Next
Nothing outstanding. The move itself continues in the SF Setup app.
