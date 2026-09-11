# SF Move HQ — handoff

**Status: v111 · Sep 11 · previous main head b2739ec.** Single-file PWA, `index.html`, no build, no CDN.
localStorage key `sfMoveApp_v1`. Sync (Gist + token) lives in `sfMoveSync` only — never in app state, never in the repo.

## This session (v111)
- Appended **`chg-030`** (18:18, 19.68 kWh, $8.66, 21 min) and **`chg-031`** (21:02, same kWh/cost, 28 min),
  both Harris Ranch, Coalinga. Nothing else in CHARGES touched. Day 5 now runs …029 → 030 → 031.
- They share one address, so they merge into **one pin reading "2 stops here"** — the Holbrook pattern.
  Each seeds one actual Day 5 charging row; both rows read "Harris Ranch, CA" and are told apart by clock.
- Both sit **after** the Coalinga arrival, so `chDrive` stays 0 and neither is charged against moving time.
- `chg-031.note` carries the "kWh/cost mirrored from chg-030, verify against charging history" caveat.
  **It does not render anywhere** — `seedCharges` builds its Spend note from `c.name`. It is a data
  annotation for whoever reconciles the Tesla app later, nothing more.
- **v109's pin assertion was superseded, not broken.** It located the Lost Hills cluster with a 10px
  screen-pixel disc; at this scale that disc also catches Harris Ranch sixty miles away. Repointed to
  locate the cluster **by id**. Same trap caught my first draft of v111 — locate by id, never by pixels.

## Where things are (index.html)
- `CHARGES` ~1875–1898 (append at the end); `LIFETIME` ~1900 (read-only, never touches trip totals).
- `seedCharges` ~3421 · `seedExpenses` ~3434 · `seedSpend` ~3330 · `pinClusters` ~2867 · `pinPopOpen` ~2950.
- Migrations ~1200–1345 (new ones go at the END, behind a NEW flag — editing an already-flagged block is a
  no-op on every device that consumed the flag). `dayStats`/`tripStats` ~2496. Footer version line ~850.

## Tests
- Repo: `test/trip-time.test.js`, `test/trip-map.test.js`.
- Scratchpad sweep: `scratchpad/sweep.sh` — **36 suites, all green at v111**. `v111.js` covers the two new
  sessions, the shared cluster, the "2 stops here" popup, and the two seeded Spend rows.
- **HARNESS RULE:** never retype a number that also lives in index.html. Reconcile from the source arrays,
  assert the delta a change causes, or assert structure/behaviour. Fixture inputs use obviously-fake values.
- verify-77 occasionally reports NO RESULT inside the sweep but passes standalone — runner flake, not a fail.

## Next
Nothing outstanding. Day 5 (Coalinga) still has no rolled/arrived stamps, so it is correctly excluded
from the averages — the sessions above land on Day 5 by date regardless.
