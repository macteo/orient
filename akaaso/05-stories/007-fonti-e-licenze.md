---
id: S-007
title: Leggere da dove vengono i simboli
persona: apprendista
priority: secondary
status: traced
features: [F-005, F-006, F-009]
modules: [sito, mazzi]
apis: []
pages:
  - R-001
  - R-005
data_sources: [content/fonti.json]
fixtures: []
---

## Narrative

As an apprendista (or a parent looking over a shoulder), I want to know
where the drawings and texts come from and who to write to about a
mistake, so that I trust the cards.

A parent notices a definition that reads oddly, goes back to the home,
taps *Fonti e licenze* at the bottom of the deck list, finds the Swiss
Orienteering translation credited and a mail link, and writes.

## Preconditions

- Built site; `content/fonti.json` with the six entries of
  [3.008](../03-modules/008-security-compliance-and-recovery.md).

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Is on the home | R-001 (/) | D-001 | entry point | — | sito | link *Fonti e licenze* under the deck list |
| 2 | Taps *Fonti e licenze* | R-005 (/fonti/) | D-005 | tap "Fonti e licenze" | — | sito | page generated from `fonti.json`: six sections, licence links, BSD text in full, the family-use note |
| 3 | Taps the mail link | R-005 | D-005 | tap the mail link | — | sito | `mailto:` with subject *orient* opens the mail app |

## Expected Outcomes

- Every register entry present; external links are anchors, none is a
  resource load (the dist check allows exactly these).

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| Base path | Site served under `/orient/` | The link resolves; no absolute path |

## E2E Mapping

- **Test name:** journey-fonti
- **Tier:** standard
- **Seeding:** built site
