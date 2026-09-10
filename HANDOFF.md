# SF Move — handoff

## Status
v97 · Sep 10 · previous main head 55ece9c. Single-file PWA: index.html + sf-icon.png + data/lifetime-charges.json (source only — its 262 rows are INLINED as LIFETIME; the app never fetches at runtime) + three design/*mockup.html + design/verify/v97-trip.png (the 393×852 acceptance shot for this build). All state in localStorage key sfMoveApp_v1 (+ sfMoveSync for the Gist ID/token/device, never merged, never in the repo). Served from epicminds-eng.github.io/sf-move (Pages deployment unverified this session).

## This session (v83 → v97)
- v97 THREE TRIP FIXES. (1) MAP LAYER CONTROL is a bar, not a floating pill: `.mapseg` is `position:absolute;left:0;right:0;bottom:0`, flush across the bottom edge of the map and clipped by `.trmap{overflow:hidden}`, height `var(--s7)` off the space scale, `grid-template-columns:repeat(var(--seg-n,5),1fr)` with `--seg-n` set by syncMapSeg from the button count, so segments are true fractions of the bar. Frosted (`backdrop-filter:saturate(180%) blur(16px)` over `rgba(255,255,255,.72)`) with a hairline top border; active = filled `--c-accent` + white glyph, inactive = `--c-grey-cool`. Same five toggles, same icons, same behaviour. (2) MAP HEIGHT: `MAP_TALL=1.3` grows the fitted VB_ROUTE crop about its centre — a ratio on the auto-fit box, no pixel height anywhere. VB_LIFE inherits the new aspect, so switching layers still does not resize the card. viewBox h 194→252 at the same width; the route keeps its scale and re-centres, nothing clipped or squashed. (3) STAT ROWS one line everywhere on Trip: `.statrow` is `repeat(var(--n),1fr)` (--n from statrow()'s item count) instead of auto-fit, `.trstrip` is `repeat(4,1fr)`; cells are flex columns with `justify-content:flex-end` so value+label bottom-align on one baseline; every `b` and `span` is nowrap and NO LONGER ellipsized; side padding on the cells is gone (it was what forced the ellipsis at 320). Money in stat rows uses money() (whole dollars) not money2(). Labels shortened to fit: hotels = booked · hotel spend · avg / night · to book; charging/day-hero = "at chargers", "avg stop"; the day-hero miles value is the number alone with the plan in its label ("6" / "of ~580 mi"); the today strip = mi to go · time to go · at chargers · spent today.
- v83–v96 before it: chg-013…chg-022 logged, Day 3 arrival + Holbrook hotel/Safeway, Day 5 restructured to Coalinga (Harris Ranch) with LA demoted to an unlabeled waypoint, horizontal-pan + empty-header fixes, the token system and one fluid layout, the three-line progress card, the lifetime charging layer (262 sites), the Hotels section and Hotels map layer.

## Rough
- STAT MATH: dayStats separates chMin (ALL the day's charging minutes — the honest "time at chargers") from chDrive (only each session's OVERLAP with rolled → arrived). Moving time is d2d − chDrive, clamped to 0 when a session's minutes exceed door-to-door, so an evening top-up after arrival cannot inflate average speed.
- Everything is verified only in headless Chromium (Playwright, CDP touch events for the map). Nothing has been run on a real iPhone: tab-bar detach, date picker, clipboard, share sheet, geolocation, the standalone PWA shell.
- The container's fallback font is WIDER than SF Pro, so the 320px fit margins in the verify suite are pessimistic — on a real iPhone every stat label has more room than the tests allow.
- A few LOD town labels (Bloomington, Springfield, Normal IL, Fenton MO) and one pin halo sit outside the crop horizontally. Pre-existing, unchanged by v97, and only reachable while zoomed; verify-97 reconciles the set rather than asserting zero.
- Map LOD collision uses estimated text boxes, not getBBox (the Trip page is display:none at init), so a near-miss can still touch; shields are hand-placed mid-leg.
- A Reset or double-tap takes ~1.2 s to settle exactly on 1×; until it lands the map keeps touch-action:none, so a one-finger drag pans instead of scrolling.
- A seeded charge or expense keeps its day/stopId if departDate changes later. Mom's auto-arrive radius is ~5 mi around 33.22721,-111.88610; Chandler city centre (6 mi out) does not trigger it.
- Stale mover-era prose remains in Sort/Reference copy; the Sort hero "116 items · 8 categories" is static text.

## Where things live
- State init + migrations (all additive, each behind a one-time flag): index.html:938–986. Change tracking in commit()/save()/saveSeed(); SYNC_SKIP and ID_ARRAY govern what merges.
- Trip: renderTrip :1497, map LOD :1775, VB_ROUTE/VB_LIFE/MAP_TALL :2156, zoom+pan :1891, statrow() :2834, renderTripStrip :2555, renderChargingSec :2903, hotels (nightsList/hotelStats/renderHotelsSec) :2940+.
- Other tabs: renderMove :1110, renderSort :1189, renderBeforeLeave :1295, renderPack :1340, renderSpend :2555+, tabs :2997.
- Playwright suites are SCRATCHPAD-ONLY (sweep.sh runs verify-74…verify-97 + edge + edge2, all green at v97) and die with the session; Chromium is at /opt/pw-browsers/chromium, NODE_PATH=$(npm root -g). HARNESS RULE: never retype a number that also lives in index.html — reconcile from the source arrays, assert the delta a test causes, or assert structure/behaviour. verify-97 follows it by diffing the new crop against the PREVIOUS build's own viewBox (git show HEAD:index.html) instead of hard-coding heights.

## Next
- Create the secret gist + a gist-scope classic PAT, connect the iPhone first (its data wins as the established device), then the iPad. Real GitHub API behaviour (ETag on PATCH, rate limits) is unverified.
- Test on the actual iPhone/iPad as a standalone PWA, including the new bottom map bar over the map's own pan gestures.
- Keep logging the drive: sessions into CHARGES (chg-023…), receipts into EXPENSES (exp-009…); both seed Spend once by id.
- Version numbering drifted: v96 shipped twice by request, so this build is v97. Read the footer before the next bump.
