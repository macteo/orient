# 004 — Scope Boundaries

**Level:** 1 — Vision & Scope
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [001](001-problem-statement.md), [002](002-target-users.md), [003](003-success-criteria.md)
**Sources:** [S3] columns C – H and §13, [S1] §3.1 – 3.7
**Enforced by:** the out-of-scope list below is checked against every Level 4 feature at Level 4 sign-off

## The Spec

### In scope for v1

- **Two decks**, one per source document, kept separate:
  - *Descrizioni dei punti* [S3] — columns C (quale degli oggetti simili),
    D (oggetto), E (informazioni complementari), F (dimensioni /
    combinazioni), G (posizione della lanterna), H (altre informazioni),
    and §13 special instructions.
  - *ISOM 2017-2* [S1] — §3.1 Forme del terreno, §3.2 Rocce e sassi,
    §3.3 Acqua e paludi, §3.4 Vegetazione, §3.5 Opere dell'uomo,
    §3.7 Simboli di tracciamento percorsi.
- **Deck filter by section** — a learner can drill one column or one colour
  family, or a whole deck.
- **Two modes.**
  - *Flash card*: symbol on the front; on the back, the Italian name and the
    source's one-line definition. Tap to flip, then self-grade
    ("lo sapevo" / "non lo sapevo"). Cards graded wrong come back at the end
    of the run.
  - *Quiz*: the symbol and four Italian names to choose from, distractors
    drawn from the same section. Verdict at once; on a wrong pick the right
    name is shown; score at the end. The reverse direction — a name and four
    symbols — is included, because it costs nothing once the first exists.
- **Italian only, verbatim.** Interface text is Italian. Names and
  definitions are copied from the sources word for word — never shortened,
  simplified or reworded. Every learner is assumed able to read them
  ([002](002-target-users.md)).
- **Mobile-first website**, public URL, no login.
- **An attribution page** naming the three sources, their authors and their
  licences, and a way to write to the curator.

### Out of scope for v1 — deferred, named so they do not creep back

- **The ISSprOM 2019-2 sprint deck** [S2]. Supplied with the brief, held
  back by the founder on 2026-09-05. The source stays converted in
  `sources/`; adding the deck later is the same pipeline run on a third PDF.
- Accounts, sync, progress on more than one device.
- Persistent progress and statistics. A per-browser version is the first
  candidate for v1.1.
- Spaced-repetition scheduling.
- Coach or parent views, groups, sharing, leaderboards.
- Other content: contour reading from map clips, technique vocabulary, rules,
  MTBO and Ski-O symbol sets.
- [S1] §3.6 *Simboli tecnici* — registration marks and north lines have
  nothing to memorise.
- [S3] columns A and B — control number and code are numbers, not symbols.
- More than one difficulty level.
- Any language other than Italian, English included.
- A native app, offline use, installability as a PWA.
- Any "support" beyond the attribution page. Of the three readings offered
  at the gather round, the brief's "support" is *learning support*: the
  definition on the back of the card. The coach reading and the
  product-support reading are out.

### The cut line

If artwork extraction ([005](005-constraints.md)) turns out to be
expensive, the ISOM deck is dropped before any code changes. The control
descriptions deck is v1's spine and is never cut.

## The Reasoning

Scope at this level is mostly a list of *no*s, and the brief wrote most of
them for us. The judgement calls were three.

**Two decks, not three.** The brief says "IOF e ISOM" but the sources
folder holds three PDFs, sprint included. We proposed all three, since the
pipeline that extracts one deck extracts three and the sprint deck is where
forest and sprint symbols differ in ways that decide races (passable versus
impassable). The founder held the sprint deck back — "per ora fuori" — and
the brief's own words win over a folder listing. It is the first item on
the deferred list, and the decks that remain stay separate rather than
merged, because the same feature can carry a different number and a
different drawing across specifications and a learner should drill the one
they will race on.

**Two modes, not one.** The brief names both flash cards and quizzes. They
are different exercises: a flash card is recall with self-grading, a quiz is
recognition with a verdict. Both are cheap; the verdict logic exists for the
quiz and the flip exists for the card. The reverse quiz direction rides on
the same rendering.

**Definition on the card back.** From the challenge in
[001](001-problem-statement.md): the skill is recognition to meaning, not
recall of a label, so the back of the card carries the source's definition
under the name.

### Options Considered

1. **Minimal** — control descriptions only, quiz only. Ships fastest, but
   throws away two of the three documents the brief supplied.
2. **Two decks, two modes, no persistence** — everything the brief names,
   nothing it does not. **Chosen.**
3. **Three decks, sprint included** — everything in the folder. Proposed,
   and cut back to two by the founder. Deferred, not rejected.
4. **Two decks plus per-browser progress** — one small step past the brief.
   Tempting and cheap, but the first step past "molto semplice" is the one
   that matters. Deferred to v1.1 explicitly.

### The Challenge

*Two decks double the artwork work.* True, and it is why the cut line
exists: the extraction is run once per PDF, and if the first run is painful
the ISOM deck is dropped before any code changes.

*Distractors from the same section make the quiz hard for a child.* By
design: distractors from a random section make it trivial (a blue symbol
among brown ones). One difficulty in v1. We asked whether the youngest
learner would need an easier one; the answer in
[002](002-target-users.md) was that everyone is assumed able to follow the
material as written, so the question is closed.

## Change Log

- 2026-09-05 — confirmed by the founder with one correction: ISSprOM out of v1 ("per ora fuori"). Two decks instead of three; cut line, options and challenge rewritten; verbatim-Italian rule made explicit; the difficulty question closed via 002.

[S1]: <../sources/ISOM_2017-2_CH_IT.md>
[S2]: <../sources/ISSprOM_2019-2_IT.md>
[S3]: <../sources/iof_descrizioni_punti_ital.md>
