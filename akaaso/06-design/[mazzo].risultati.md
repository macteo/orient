---
id: D-004
route: R-004
title: Risultati
features: [F-010, F-004]
stories: [S-001, S-002, S-003, S-004, S-005, S-006]
components: [Progress, Alert, Button, Card, ListGroup, FacciaCarta, Badge]
states: [default, nessun-errore, ripasso, conferma-cancellazione, empty, error]
artboards:
  default: _artboards/[mazzo].risultati.dc.html
  nessun-errore: _artboards/[mazzo].risultati.nessun-errore.dc.html
  ripasso: _artboards/[mazzo].risultati.ripasso.dc.html
  conferma-cancellazione: _artboards/[mazzo].risultati.conferma-cancellazione.dc.html
  empty: _artboards/[mazzo].risultati.empty.dc.html
  error: _artboards/[mazzo].risultati.error.dc.html
transitions:
  - { affordance: 'tap "Ripassa con le carte"', to: D-002 }
  - { affordance: 'tap "Ripeti"', to: D-002 }
  - { affordance: 'tap "Ripeti" after a quiz', to: D-003 }
  - { affordance: 'tap "Torna ai mazzi"', to: D-001 }
  - { affordance: 'tap "Scegli un mazzo"', to: D-001 }
  - { affordance: 'tap a miss row', to: D-004 }
  - { affordance: 'tap "Chiudi"', to: D-004 }
  - { affordance: 'tap "Cancella i risultati"', to: D-004 }
  - { affordance: 'tap "Cancella tutto"', to: D-004 }
status: approved
artboard_version: v1
---

## Purpose

The results of a deck (F-010): the last run's score and misses, the review of a miss, replay and repeat, the history, and the clear action.

## Layout

Header with title and run title. Score Card (44 px number, caption, Progress `md`). Misses Card with a header band and one row per miss (face at `lista`, name, reference, chevron) or a teal Alert when none. *Ripassa con le carte* `lg`, then *Ripeti* and *Torna ai mazzi* side by side. History Card with a header band and rows (date, what, score). The clear link at the bottom, replaced inline by the confirmation panel. The review is a bottom sheet over a scrim inside the frame. Authority: `_artboards/[mazzo].risultati.dc.html`.

## Components

| Component | Contract | Used for |
|---|---|---|
| Progress | `design-system/components/feedback/Progress.prompt.md` | score bar, `md` |
| Alert | `design-system/components/feedback/Alert.prompt.md` | *Nessun errore in questa serie*, soft green |
| Button | `design-system/components/buttons/Button.prompt.md` | *Ripassa con le carte* solid `lg`; *Ripeti* outline `md`; *Torna ai mazzi* ghost `md`; *Annulla* outline and *Cancella tutto* solid red in the confirmation; *Scegli un mazzo* in the empty state |
| Card | `design-system/components/data-display/Card.prompt.md` | score, misses, history containers with header bands |
| ListGroup | `design-system/components/data-display/ListGroup.prompt.md` | the misses and the history as bordered vertical lists |
| FacciaCarta | `design-system/components/orient/FacciaCarta.prompt.md` | miss rows at `lista`; the card back at `carta` in the review sheet |
| Badge | `design-system/components/feedback/Badge.prompt.md` | reference and *generata* on the reviewed card |

## States

| State | Artboard | When | Notes |
|---|---|---|---|
| default | `[mazzo].risultati.dc.html` | last run has misses | actions include *Ripassa con le carte* |
| nessun-errore | `[mazzo].risultati.nessun-errore.dc.html` | last run had no miss | Alert instead of the list; replay button absent |
| ripasso | `[mazzo].risultati.ripasso.dc.html` | a miss row tapped | bottom sheet with the card back and *Chiudi*; a state of this screen, not a route |
| conferma-cancellazione | `[mazzo].risultati.conferma-cancellazione.dc.html` | first tap on *Cancella i risultati* | inline red panel with *Annulla* and *Cancella tutto* |
| empty | `[mazzo].risultati.empty.dc.html` | no run stored for the deck | message and *Scegli un mazzo* |
| error | `[mazzo].risultati.error.dc.html` | storage unreadable or malformed | empty layout with the one-line note |

## Transitions

| Affordance | Goes to | Serving story |
|---|---|---|
| tap "Ripassa con le carte" | D-002 | S-002 |
| tap "Ripeti" | D-002 | S-006 |
| tap "Ripeti" after a quiz | D-003 | S-002 |
| tap "Torna ai mazzi" | D-001 | S-001, S-003 |
| tap "Scegli un mazzo" | D-001 | S-006 empty variant |
| tap a miss row | D-004 (same screen, state change) | stories' in-screen steps |
| tap "Chiudi" | D-004 (same screen, state change) | stories' in-screen steps |
| tap "Cancella i risultati" | D-004 (same screen, state change) | stories' in-screen steps |
| tap "Cancella tutto" | D-004 (same screen, state change) | stories' in-screen steps |

## Content rules

Titles *Serie completata* / *Quiz completato*; captions *carte che sapevi* / *risposte corrette*; misses header *N simboli da ripassare* (singular *1 simbolo*). Confirmation text names the scope: all results on this phone, all decks. Error note: *Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.*

## Accessibility notes

The clear action needs two taps and the second is a distinct red button. The review sheet traps focus and closes on *Chiudi*. History rows are not tappable.
