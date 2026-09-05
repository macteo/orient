---
id: D-001
route: R-001
title: Home — scelta del mazzo e delle sezioni
features: [F-001, F-010]
stories: [S-001, S-002, S-003, S-004, S-005, S-006, S-008]
components: [Card, Checkbox, Button]
states: [default]
artboards:
  default: _artboards/index.dc.html
transitions:
  - { affordance: 'tap "Inizia" in modalità Flash card', to: D-002 }
  - { affordance: 'tap "Inizia" in modalità Quiz', to: D-003 }
  - { affordance: 'tap "Risultati" on a deck row', to: D-004 }
  - { affordance: 'tap "Fonti e licenze"', to: D-005 }
  - { affordance: 'change the picker', to: D-001 }
status: approved
artboard_version: v1
---

## Purpose

The only place a run is configured (F-001): four decks with their sections, mode, direction, cards per run, and the start button; the last score per deck with a link to its results (F-010).

## Layout

Header with the wordmark and one line of help; a scrolling list of four deck Cards, the first open, each with a disclosure and its section rows (custom 22 px checkbox in a 44 px row, label, count); a fixed bottom bar with the segmented control, the direction pills (quiz only), the size chips and the primary Button. Authority: `_artboards/index.dc.html`; its props `modo`, `carte`, `nessunaSezione`, `conRisultati` show the picker's variants, which are content, not states.

## Components

| Component | Contract | Used for |
|---|---|---|
| Card | `design-system/components/data-display/Card.prompt.md` | one per deck, disclosure header and section rows |
| Checkbox | `design-system/components/forms/Checkbox.prompt.md` | the section rows — drawn as 22 px boxes inside 44 px rows, same fill rule as the contract |
| Button | `design-system/components/buttons/Button.prompt.md` | primary `lg` start button, disabled with a different label when no section is checked |

## States

| State | Artboard | When | Notes |
|---|---|---|---|
| default | `index.dc.html` | always | with or without stored results; deck order fixed: descrizioni-simboli, descrizioni-complete, esempi, isom |

## Transitions

| Affordance | Goes to | Serving story |
|---|---|---|
| tap "Inizia" in modalità Flash card | D-002 | S-001, S-003, S-004 |
| tap "Inizia" in modalità Quiz | D-003 | S-002, S-003, S-005 |
| tap "Risultati" on a deck row | D-004 | S-006 |
| tap "Fonti e licenze" | D-005 | S-007 |
| change the picker | D-001 (same screen, state change) | stories' in-screen steps |

## Content rules

Button label *Inizia · N carte* with N = min(size, available); *Scegli almeno una sezione* when disabled. Chips 8 · 12 · 23 · tutte. Last score line *Ultima serie 6 / 8 · flash card*. All Italian, sentence case.

## Accessibility notes

Section rows are the tap target (44 px), not the box. Segmented control and pills are radio groups with visible selection and a text label; the start button is the last focusable element in the bar.
