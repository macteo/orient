---
id: D-003
route: R-003
title: Quiz
features: [F-003, F-004]
stories: [S-002, S-003, S-005]
components: [Progress, Alert, Button, FacciaCarta, RigaDescrizione, Verdetto]
states: [default, inversa, verdetto, ripresa, empty, invalid-input]
artboards:
  default: _artboards/[mazzo].quiz.dc.html
  inversa: _artboards/[mazzo].quiz.inversa.dc.html
  verdetto: _artboards/[mazzo].quiz.verdetto.dc.html
  ripresa: _artboards/[mazzo].quiz.ripresa.dc.html
  empty: _artboards/[mazzo].quiz.empty.dc.html
  invalid-input: _artboards/[mazzo].quiz.invalid-input.dc.html
transitions:
  - { affordance: 'tap "← Mazzi"', to: D-001 }
  - { affordance: 'completion of the run', to: D-004 }
  - { affordance: 'tap "Torna ai mazzi"', to: D-001 }
  - { affordance: 'pick an option', to: D-003 }
  - { affordance: 'tap "Avanti"', to: D-003 }
status: approved
artboard_version: v1
---

## Purpose

One quiz run (F-003): a question card and four options; a pick gives the verdict at once; *Avanti* continues; completion goes to the results.

## Layout

Same header as D-002. A question Card with the prompt and the card face (forward) or the name / sentence (reverse); below it four option rows (forward) or a 2×2 grid of tiles with faces (reverse); the Verdetto panel after a pick; bottom bar with *Avanti* or the hint *Scegli una risposta*. Authority: `_artboards/[mazzo].quiz.dc.html`; prop `mazzo` switches the deck (default shows the ISOM drawing with its printed annotations).

## Components

| Component | Contract | Used for |
|---|---|---|
| Progress | `design-system/components/feedback/Progress.prompt.md` | run progress |
| Alert | `design-system/components/feedback/Alert.prompt.md` | `ripresa` and `invalid-input` notices |
| Button | `design-system/components/buttons/Button.prompt.md` | *Avanti* / *Vedi il risultato* solid blue `lg`; empty-state button |
| FacciaCarta | `design-system/components/orient/FacciaCarta.prompt.md` | the question face at `carta`; option tiles at `tile` in reverse |
| RigaDescrizione | `design-system/components/orient/RigaDescrizione.prompt.md` | row question and row tiles for descrizioni-complete |
| Verdetto | `design-system/components/orient/Verdetto.prompt.md` | marks on the options and the panel with title and definition |

## States

| State | Artboard | When | Notes |
|---|---|---|---|
| default | `[mazzo].quiz.dc.html` | question shown, nothing picked | forward direction; four name rows |
| inversa | `[mazzo].quiz.inversa.dc.html` | `?direzione=inversa` | name or sentence as the question; four face tiles; declared by S-002 and S-003 as its own state because the layout and the tap targets differ |
| verdetto | `[mazzo].quiz.verdetto.dc.html` | an option picked | options locked; ✓ / ✕ marks; panel; *Avanti* |
| ripresa | `[mazzo].quiz.ripresa.dc.html` | run restored after a reload | Alert once; direction preserved |
| empty | `[mazzo].quiz.empty.dc.html` | no card for the sections | as D-002 |
| invalid-input | `[mazzo].quiz.invalid-input.dc.html` | bad query | Alert; forward direction, all sections |

## Transitions

| Affordance | Goes to | Serving story |
|---|---|---|
| tap "← Mazzi" | D-001 | S-002 |
| completion of the run | D-004 | S-002, S-003, S-005 |
| tap "Torna ai mazzi" | D-001 | S-002 empty variant |
| pick an option | D-003 (same screen, state change) | stories' in-screen steps |
| tap "Avanti" | D-003 (same screen, state change) | stories' in-screen steps |

## Content rules

Prompts: *Quale oggetto?* (forward), *Quale simbolo?* (reverse), *Cosa dice questa riga?* (rows, forward). Verdict titles exactly *Giusto* and *Sbagliato — <nome>*; body is the verbatim definition. Last card's button reads *Vedi il risultato*.

## Accessibility notes

Options are 56 px rows or 116 px tiles; after a pick they are disabled, and the verdict panel is announced. Right and wrong carry a mark and a title, never colour alone (Verdetto contract).
