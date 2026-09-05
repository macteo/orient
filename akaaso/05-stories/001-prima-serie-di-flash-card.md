---
id: S-001
title: Prima serie di flash card sulle descrizioni dei punti
persona: apprendista
priority: spine
status: traced
features: [F-001, F-002, F-004, F-006, F-010]
modules: [sito, allenamento, mazzi]
apis: []
pages:
  - R-001
  - R-002
  - R-004
data_sources: [content/simboli/descrizioni-punti.json, localStorage.orient.serie.v1, localStorage.orient.risultati.v1]
fixtures: []
---

## Narrative

As an apprendista, I want to open the site and start going through symbol
cards immediately, so that I learn what the pictograms mean without
setting anything up.

Giulia, twelve, has an event on Sunday. On the sofa she opens
`macteo.github.io/orient/` on her phone, does not touch the picker, taps
*Inizia · 8 carte*, flips each card, says whether she knew it, gets the
two she missed again at the end, and sees *6 / 8 · carte che sapevi*.

## Preconditions

- The site is built from the committed `content/` with the four decks;
  `descrizioni-simboli` has all its sections.
- The browser has no `orient.*` keys (first visit).
- No login: there is none.

## Journey Steps

| # | User action | Page/route | Screen | Transition in | API calls | Modules | Data in → out |
|---|-------------|------------|--------|---------------|-----------|---------|---------------|
| 1 | Opens the site URL | R-001 (/) | D-001 | entry point | — | sito | embedded deck summaries → four decks, first open, all sections checked, *Flash card*, size 8, button *Inizia · 8 carte* |
| 2 | Taps *Inizia · 8 carte* | R-002 (/descrizioni-simboli/flashcard/) | D-002 | tap "Inizia" in modalità Flash card | — | sito, allenamento | query `carte=8` → run of 8 cards drawn from all sections; `orient.serie.v1` written |
| 3 | Taps the card | R-002 | D-002 | tap the card | — | allenamento | front → back: pictogram small, badge `1.2`, *Naso*, definition |
| 4 | Taps *Lo sapevo* six times and *Non lo sapevo* twice across the eight cards | R-002 | D-002 | tap "Lo sapevo" or "Non lo sapevo" | — | allenamento | each grade → `risposte` appended, `coda` gains the two misses, storage mirrored |
| 5 | Sees the two missed cards again after the eighth, grades them | R-002 | D-002 | replay of the misses | — | allenamento | replay served from `coda`; counter reads 9 / 10, 10 / 10 |
| 6 | Lands on the result | R-004 (/descrizioni-simboli/risultati/) | D-004 | completion of the run | — | allenamento | `Risultato` appended (`viste: 8, giuste: 6, sbagliate: [ds:1.2, ds:11.4E]`), `orient.serie.v1` cleared → score *6 / 8*, caption *carte che sapevi*, two miss rows |
| 7 | Taps *Torna ai mazzi* | R-001 (/) | D-001 | tap "Torna ai mazzi" | — | sito | storage read → deck row shows *ultima serie 6 / 8 · flash card* and a *Risultati* link |

## Expected Outcomes

- The user sees eight distinct cards, then the two misses once more, then
  a result with the right numbers and the two missed symbols listed.
- `orient.risultati.v1` holds one `Risultato` for `descrizioni-simboli`;
  `orient.serie.v1` is absent.
- No request left the origin; no cookie was written.

## Variants

| Variant | Trigger | Expected behavior |
|---------|---------|-------------------|
| `retro` | Any card tapped | Back shown with grade buttons; front has none |
| `ripresa` | Phone locks after step 4; page reloaded | Run resumes at the same card, un-flipped, notice *Serie ripresa* once |
| `empty` | R-002 opened with `?sezioni=colonna-f` on a build where that section has no cards | Message *Nessuna carta per le sezioni scelte* and a link to R-001; nothing written |
| `invalid-input` | R-002 opened with `?sezioni=xyz&carte=99` | One-line notice; run starts on all sections with size 8 |
| `error` | Storage accessor throws (private mode with storage blocked) | Run works end to end; R-004 shows `error` state with its note |
| Second miss | A replayed card graded *Non lo sapevo* again | Not re-queued; listed on the result once |
| `loading` | — | Not applicable: content is compiled in, nothing is fetched |
| `permission-denied` | — | Not applicable: no permissions exist |

## E2E Mapping

- **Test name:** journey-prima-serie-di-flash-card
- **Tier:** @critical
- **Seeding:** built site; empty storage; the test pins the RNG seed of the run through a test-only query parameter so the eight cards are known
