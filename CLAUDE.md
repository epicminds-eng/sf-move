# SF Move

## Session handoff
- At session start, if HANDOFF.md exists in the repo root, read it before anything else.
- Before every commit, rewrite HANDOFF.md: status line, what changed this session, what's rough, where the pieces live, next step. Keep it under 40 lines. Never delete it.
- If the repo has no HANDOFF.md, create it with the first commit of the session.

## Design rules
- Mockups are reference for LOOK, never for STRUCTURE. Apply their styling — type, color, spacing, list treatment. Never add a tab, section, sub-tab, picker, or navigation row because a mockup shows one. If a mockup implies a structural change, stop and raise it before building.
- No link or button ever announces that it is a link. Never "Open in", "Link to", "Tap to", "Go to", "View" or "Click" in a label — the label is the destination or the action noun alone ("Apple Maps", "Orbitz", "Supercharger", "Charging details").
