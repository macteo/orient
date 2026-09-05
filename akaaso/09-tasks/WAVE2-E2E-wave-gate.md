# WAVE2-E2E-wave-gate — Wave 2 post-merge gate

Runs **inline on `develop`** after every impl task of wave 2 has merged.
Not a spawned agent. Red gate = wave not done.

## Checks

```bash
npm ci
npm run check:content          # skip only while no content producer has landed (wave 0 before parsers)
npm test
VITE_BASE=/orient/ npm run build
npm run check:dist
npm run e2e:smoke              # from wave 3 on, when pages exist
npm run e2e -- --grep @critical   # wave 5
grep -rn '^<<<<<<<\|^>>>>>>>' src scripts content akaaso/09-tasks e2e || true   # must print nothing
```

Wave-specific: generate.json committed at count 200; check:content regenerates and diffs clean.

## Done Criteria

1. Every command above that applies to this wave exits 0 on `develop`.
2. No conflict marker anywhere in the tree.
3. The summary (commands run, counts, durations) is added to this task's history via `bun scripts/tasks/status.ts addHistory WAVE2-E2E-wave-gate gate "<summary>"`.
