# 004 — API Design

**Level:** 2 — Architecture & Stack
**Status:** Confirmed
**Date:** 2026-09-05
**Depends on:** [002](002-application-architecture.md), [003](003-data-and-content.md)
**Enforced by:** the origin-only request check in [009](009-cicd-and-releases.md); the built output contains no `fetch`, `XMLHttpRequest` or `WebSocket` call to any URL

## The Spec

- **There is no API.** No endpoints, internal or public.
- The only network activity a page performs is loading its own static
  assets from the same origin.
- If a future version needs one (shared progress, a coach view), it is a
  new Level 2 decision with its own hosting consequence.

## The Reasoning

Recorded as a decision so that nobody adds one by habit. Every candidate
consumer of an API — progress sync, analytics, a feedback form — is on the
Level 1 deferred list, and the no-personal-data rule in
[1.005](../01-vision/005-constraints.md) is far easier to keep when there is
nowhere for data to go.

### Options Considered

1. **None.** **Chosen.**
2. **A form backend for feedback.** The attribution page offers a `mailto:`
   link instead ([1.004](../01-vision/004-scope-boundaries.md)).

### The Challenge

*A `mailto:` link is a poor feedback channel.* It is, and it is the right
size for a family.
