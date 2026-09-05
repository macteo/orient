# 001 — Problem Statement

**Level:** 1 — Vision & Scope
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** —
**Sources:** the brief of 2026-09-05 (quoted below), [S1], [S2], [S3], [F2]
**Enforced by:** —

## The Spec

- orient is a simple website that turns two Italian orienteering symbol
  references — [S3] the IOF control descriptions and [S1] ISOM 2017-2 — into
  flash cards and quizzes, and tells the learner whether each guess was
  right. A third reference, [S2] ISSprOM 2019-2, was supplied with the brief
  and is deferred ([004](004-scope-boundaries.md)).
- The problem it solves is memorising the symbols and what they mean, in
  Italian. The reference apps ([F2] Orisym, [F3] iknow-O) are in English; the
  Italian references are PDFs, which can be read but not drilled.
- The users are one family, for now. Nothing in v1 exists for anyone else.
- Without orient the family reads the PDFs, makes paper cards, or uses an
  English app and translates in their head.

## The Reasoning

The brief, verbatim:

> Vorrei qualcosa come Orisym, ma in italiano, basato sui IOF e ISOM (che ti
> ho messo in pdf sulla cartella sources). Semplice sito che permetta di
> generare quiz e flash card e che poi permetta di vedere se il guess fatto è
> corretto. Molto semplice. Da usare per ora in famiglia per memorizzare i
> simboli. Mi va bene che sia online su un sito.

Four things in it are decisions, not wishes. *Come Orisym* names the shape:
a catalogue of symbols and a way to test yourself on them. *In italiano* names
the gap: every drill tool we found is in English. *Molto semplice*, said twice,
is a constraint on the product — we read it as "if a feature needs
explaining, it is out". *In famiglia* names the audience and, with it, most
of what is out of scope: no accounts, no coach, no club.

The three PDFs the brief points at are better than we expected. Two are Swiss
Orienteering's literal Italian translations of the IOF map specifications,
with FISO's map commission credited for the Italian, published under a
Creative Commons licence ([S1], [S2]). The third is the IOF control
descriptions adapted for Switzerland, in Italian, unlicensed ([S3]). Each
holds on the order of a hundred symbols with an Italian name and a one-line
definition. That is the entire content of the product; nothing has to be
invented, only extracted. The sprint specification [S2] is held back from v1
by the founder's call, not for any fault of the document.

### Options Considered

1. **An Italian symbol dictionary** — a browsable reference. Cheapest, but
   reading is not memorising, and the PDFs already are that.
2. **A drill tool: cards and quizzes with a verdict** — what the brief asks
   for. Small, and the verdict is the whole point. **Chosen.**
3. **A learning platform** — progress, spaced repetition, a coach view. Every
   piece of it is something the brief says no to.

### The Challenge

*Is memorising symbol names the actual skill?* In a race nobody says a
symbol's name: the control description is a sheet of pictograms, and the
skill is recognition — seeing the pictogram and knowing what to look for in
the terrain. So the answer on the back of a card is not a label to parrot; it
is the meaning, in Italian: the name as the handle, and the source's own
one-line definition under it. That survived the challenge and shaped
[004](004-scope-boundaries.md): the card back carries both.

## Change Log

- 2026-09-05 — confirmed by the founder. ISSprOM [S2] moved from v1 content to deferred; the spec bullet and the source paragraph updated accordingly. Dependent decisions 003, 004, 005, 006 reviewed and updated the same day.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S2]: <../sources/ISSprOM_2019-2_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
[F2]: <https://apps.apple.com/us/app/orisym-orienteering-symbols/id6553980733>
[F3]: <https://www.iknow-o.com/>
