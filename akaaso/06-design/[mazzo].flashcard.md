---
id: D-002
route: R-002
title: Serie di flash card
features: [F-002, F-004]
stories: [S-001, S-002, S-003, S-004]
components: [Progress, Alert, Button, FacciaCarta, RigaDescrizione, Badge]
states: [default, retro, ripresa, empty, invalid-input]
artboards:
  default: _artboards/[mazzo].flashcard.dc.html
  retro: _artboards/[mazzo].flashcard.retro.dc.html
  ripresa: _artboards/[mazzo].flashcard.ripresa.dc.html
  empty: _artboards/[mazzo].flashcard.empty.dc.html
  invalid-input: _artboards/[mazzo].flashcard.invalid-input.dc.html
transitions:
  - { affordance: 'tap "← Mazzi"', to: D-001 }
  - { affordance: 'completion of the run', to: D-004 }
  - { affordance: 'tap "Torna ai mazzi"', to: D-001 }
  - { affordance: 'tap the card', to: D-002 }
  - { affordance: 'tap "Lo sapevo" or "Non lo sapevo"', to: D-002 }
  - { affordance: 'replay of the misses', to: D-002 }
status: approved
artboard_version: v1
---

## Purpose

One flash-card run (F-002): the card front, a tap flips it, two buttons grade it; the misses come back once; completion goes to the results.

## Layout

Run header (back link, counter, Progress, run title), optional Alert for the resumed or invalid-input notice, the card centred on a gray-50 canvas, a bottom bar with the grade Buttons (back) or a hint (front). The card face depends on the deck: pictogram, description row, map and sketch, ISOM drawing. Authority: `_artboards/[mazzo].flashcard.dc.html`; prop `mazzo` switches the deck, `rigaGenerata` shows a generated row.

## Components

| Component | Contract | Used for |
|---|---|---|
| Progress | `design-system/components/feedback/Progress.prompt.md` | run progress, `sm`, blue |
| Alert | `design-system/components/feedback/Alert.prompt.md` | `ripresa` (soft blue) and `invalid-input` (soft yellow) notices under the header |
| Button | `design-system/components/buttons/Button.prompt.md` | *Non lo sapevo* outline dark `lg`, *Lo sapevo* solid blue `lg`; empty-state *Torna ai mazzi* outline `md` |
| FacciaCarta | `design-system/components/orient/FacciaCarta.prompt.md` | front and back of the current card at size `carta` |
| RigaDescrizione | `design-system/components/orient/RigaDescrizione.prompt.md` | the row face for the descrizioni-complete deck |
| Badge | `design-system/components/feedback/Badge.prompt.md` | reference on the back; *generata* on generated rows |

## States

| State | Artboard | When | Notes |
|---|---|---|---|
| default | `[mazzo].flashcard.dc.html` | card front shown | hint *Tocca per girare la carta* |
| retro | `[mazzo].flashcard.retro.dc.html` | after a tap on the card | grade buttons appear; shown here on a description row |
| ripresa | `[mazzo].flashcard.ripresa.dc.html` | run restored from storage after a reload | Alert *Serie ripresa*, shown once |
| empty | `[mazzo].flashcard.empty.dc.html` | the query's sections yield no card | message and *Torna ai mazzi*; nothing written to storage |
| invalid-input | `[mazzo].flashcard.invalid-input.dc.html` | unknown section or size in the query | Alert *Sezione non trovata*; run on all sections, 8 cards |

## Transitions

| Affordance | Goes to | Serving story |
|---|---|---|
| tap "← Mazzi" | D-001 | S-001 |
| completion of the run | D-004 | S-001, S-002, S-003, S-004 |
| tap "Torna ai mazzi" | D-001 | S-001 empty variant |
| tap the card | D-002 (same screen, state change) | stories' in-screen steps |
| tap "Lo sapevo" or "Non lo sapevo" | D-002 (same screen, state change) | stories' in-screen steps |
| replay of the misses | D-002 (same screen, state change) | stories' in-screen steps |

## Content rules

Names and definitions verbatim from `content/`. Counter *i / N* counts replays. Run title *<deck> · <sections>* or *N sezioni* above two. Grade labels exactly *Non lo sapevo* and *Lo sapevo*.

## Accessibility notes

The whole card is the flip target; the grade buttons are 60 px. Card content is announced as front or back. No motion in v1 beyond colour transitions; a flip animation, if added, honours reduced motion.
