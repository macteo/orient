---
id: S-009
title: Un contenuto rotto blocca il deploy
persona: curatore
priority: secondary
status: confirmed
features: [F-007, F-009]
modules: [contenuti, sito]
apis: []
pages: []
data_sources: [content/simboli/descrizioni-punti.json, .github/workflows/deploy.yml]
fixtures: []
---

## Narrative

As the curatore, I want a mistake in the content to stop the publish
rather than reach the family, so that a deck is never silently
incomplete.

Matteo deletes a symbol entry by accident while fixing a typo, pushes, and
the workflow fails at `check:content` naming the missing reference and
its source page. Nothing deploys. He restores the entry and pushes again.

## Preconditions

- A pull request or a push to `main` with `content/simboli/descrizioni-punti.json`
  missing the entry for `1.2`.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Pushes the broken commit | — (git) | | entry point | — | — | workflow starts |
| 2 | Reads the failed job | — (GitHub) | | | — | contenuti | `check:content`: *descrizioni-punti: manca 1.2 (Naso), fonte S3 p. 7*; exit 1; build and deploy skipped |
| 3 | Restores the entry, pushes | — (git) | | | — | contenuti, sito | all jobs green; deploy runs |

## Expected Outcomes

- The previous site stayed up throughout.
- The failure message names the reference and the page.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `error` | An artwork file edited by hand | Checksum mismatch reported with the file path |
| Off-origin resource | A task adds a CDN script | `check:dist` fails naming file and line; deploy skipped |
| Absolute link | A template writes `/fonti/` | Link check fails; deploy skipped |

## E2E Mapping

- **Test name:** journey-deploy-bloccato
- **Tier:** standard
- **Seeding:** the F-007 and F-009 fixtures; runs as CI-script integration tests, no browser
