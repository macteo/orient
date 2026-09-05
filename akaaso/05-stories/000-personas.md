---
personas:
  - id: apprendista
    role: Family member learning orienteering symbols
    context: Adult or child in the founder's family; opens the site on a phone for a few minutes, at home or before an event; reads Italian
    permissions: none — the site has no accounts; everyone can do everything
    goals:
      - Recognise a pictogram or a map symbol and know what it means, in Italian
      - Read a whole control-description row as one sentence
      - See at once what was wrong and go over it again
  - id: curatore
    role: Maintainer of the site and its content (the founder)
    context: Works on a Mac in the repository; runs the extraction and generation scripts; pushes to GitHub; checks the published site on a phone
    permissions: write access to the repository; no site-side privileges exist
    goals:
      - Keep the decks complete and verbatim against the source documents
      - Add content (more generated rows, a new source revision) without touching code
      - Never ship a broken build
---

**apprendista.** Derived from [1.002](../01-vision/002-target-users.md) P1.
Mixed ages, one language, no tolerance for setup: the site has to be
usable ten seconds after the URL opens, on a phone, with the thumb. Reads
the source definitions as written ([1.002](../01-vision/002-target-users.md),
"everyone assumed able to read them"). Abandons a tool that asks for a
name, shows a spinner, or loses a run when the screen locks — which is why
the run is persisted ([2.003](../02-architecture/003-data-and-content.md)).

**curatore.** Derived from [1.002](../01-vision/002-target-users.md) P2.
Comfortable with a terminal and Swift; has minutes, not hours, per
session. Wants every check to fail loudly and every script to be
re-runnable. Abandons a pipeline that needs remembering.
