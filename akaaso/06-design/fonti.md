---
id: D-005
route: R-005
title: Fonti e licenze
features: [F-005]
stories: [S-007]
components: [Card, Badge, Button]
states: [default]
artboards:
  default: _artboards/fonti.dc.html
transitions:
  - { affordance: 'tap "← Mazzi"', to: D-001 }
  - { affordance: 'tap the mail link', to: D-005 }
status: approved
artboard_version: v1
---

## Purpose

The attribution page (F-005), generated from the licence register: every source, what orient takes from it, its licence, the attribution sentence, and a contact link.

## Layout

Header with a back link, title and one line. A scrolling list of one Card per source with a licence Badge, authors, *Cosa usiamo* and the attribution sentence in italics; a note on generated rows; a bottom bar with the contact Button and the one-line privacy statement. Authority: `_artboards/fonti.dc.html`.

## Components

| Component | Contract | Used for |
|---|---|---|
| Card | `design-system/components/data-display/Card.prompt.md` | one per source |
| Badge | `design-system/components/feedback/Badge.prompt.md` | licence label, soft, colour by licence family |
| Button | `design-system/components/buttons/Button.prompt.md` | *Scrivi a chi cura il sito*, outline `md`, a `mailto:` |

## States

| State | Artboard | When | Notes |
|---|---|---|---|
| default | `fonti.dc.html` | always | content from `content/fonti.json` |

## Transitions

| Affordance | Goes to | Serving story |
|---|---|---|
| tap "← Mazzi" | D-001 | S-007 |
| tap the mail link | D-005 (same screen, state change) | stories' in-screen steps |

## Content rules

Six sources in the order of the register. The Purple Pen BSD text is reproduced in full below the cards (the artboard shows the cards). The IOF entry carries the family-use sentence.

## Accessibility notes

External links are anchors with visible text; the mail button is the last focusable element.
