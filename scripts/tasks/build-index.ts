// Declares the P1 tasks, computes waves (Kahn levelling), adds one gate per wave,
// writes akaaso/09-tasks/_index.json and the gate task files. Idempotent.
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import type { TaskEntry, TaskIndex } from "./_schema.ts";
import { INDEX_PATH } from "./_schema.ts";

type Decl = [id: string, title: string, module: string, layer: TaskEntry["layer"], effort: TaskEntry["effort"], deps: string[], features: string[], commit: string];
const S: Record<string, string[]> = {
  "F-001": ["S-001","S-002","S-003","S-004","S-005","S-006","S-008"], "F-002": ["S-001","S-002","S-003","S-004"],
  "F-003": ["S-002","S-003","S-005"], "F-004": ["S-001","S-002","S-003","S-004","S-005"], "F-005": ["S-007"],
  "F-006": ["S-001","S-002","S-003","S-004","S-005","S-006","S-007","S-008"], "F-007": ["S-004","S-005","S-008","S-009"],
  "F-008": ["S-003","S-008"], "F-009": ["S-007","S-008","S-009"], "F-010": ["S-001","S-002","S-006"],
};
const decls: Decl[] = [
  ["P1-SITO-CONFIG-scaffold", "Project scaffold: Vite + TS + Tailwind 4 + Preline 5", "sito", "Config", "M", [], ["F-009","F-006"], "chore(sito): project scaffold"],
  ["P1-CONTENUTI-TOOL-parse-descrizioni", "Parse control-description tables, vendor pictogram SVGs", "contenuti", "Content", "M", [], ["F-007"], "feat(contenuti): parse descrizioni dei punti"],
  ["P1-CONTENUTI-TOOL-parse-isom", "Parse ISOM 2017-2 symbol list", "contenuti", "Content", "S", [], ["F-007"], "feat(contenuti): parse ISOM"],
  ["P1-CONTENUTI-TOOL-extract-isom", "Render IOF per-symbol ISOM PDFs to PNG", "contenuti", "Content", "M", [], ["F-007"], "feat(contenuti): extract ISOM artwork"],
  ["P1-CONTENUTI-TOOL-extract-esempi", "Crop worked examples and page-3 rows", "contenuti", "Content", "L", [], ["F-007"], "feat(contenuti): extract esempi"],
  ["P1-CONTENUTI-DATA-fonti-e-sezioni", "Licence register, deck sections, licence texts", "contenuti", "Content", "S", [], ["F-005","F-006"], "feat(contenuti): fonti e sezioni"],
  ["P1-CONTENUTI-DATA-righe-ufficiali", "Transcribe the nine official rows", "contenuti", "Content", "M", ["P1-CONTENUTI-TOOL-parse-descrizioni","P1-CONTENUTI-TOOL-extract-esempi"], ["F-008"], "feat(contenuti): righe ufficiali"],
  ["P1-CONTENUTI-DATA-compatibilita", "Compatibility table for generated rows", "contenuti", "Content", "M", ["P1-CONTENUTI-TOOL-parse-descrizioni"], ["F-008"], "feat(contenuti): compatibilita"],
  ["P1-CONTENUTI-TOOL-check-content", "Content check: schemas, inventories, checksums, determinism", "contenuti", "Content", "M", ["P1-CONTENUTI-TOOL-parse-descrizioni","P1-CONTENUTI-TOOL-parse-isom","P1-CONTENUTI-TOOL-extract-isom","P1-CONTENUTI-TOOL-extract-esempi","P1-CONTENUTI-DATA-fonti-e-sezioni"], ["F-007"], "feat(contenuti): check-content"],
  ["P1-ALLENAMENTO-LOGIC-serie-quiz-storage", "Run reducer, quiz options, storage, seeded RNG", "allenamento", "Logic", "M", ["P1-SITO-CONFIG-scaffold"], ["F-002","F-003","F-010"], "feat(allenamento): serie, quiz e storage"],
  ["P1-ALLENAMENTO-UI-facce", "Card faces and the description-row grid", "allenamento", "UI", "M", ["P1-SITO-CONFIG-scaffold"], ["F-004"], "feat(allenamento): facce delle carte"],
  ["P1-CONTENUTI-TOOL-generate-righe", "Prefix-stable generator for description rows", "contenuti", "Content", "M", ["P1-CONTENUTI-DATA-righe-ufficiali","P1-CONTENUTI-DATA-compatibilita","P1-CONTENUTI-TOOL-check-content"], ["F-008"], "feat(contenuti): generatore di righe"],
  ["P1-MAZZI-BUILD-decks-e-pagine", "Assemble decks and emit the thirteen pages", "mazzi", "Build", "L", ["P1-SITO-CONFIG-scaffold","P1-CONTENUTI-TOOL-parse-descrizioni","P1-CONTENUTI-TOOL-parse-isom","P1-CONTENUTI-TOOL-extract-isom","P1-CONTENUTI-TOOL-extract-esempi","P1-CONTENUTI-DATA-fonti-e-sezioni","P1-CONTENUTI-DATA-righe-ufficiali","P1-CONTENUTI-TOOL-generate-righe"], ["F-006"], "feat(mazzi): build mazzi e pagine"],
  ["P1-SITO-UI-home", "Home: deck and section picker", "sito", "UI", "M", ["P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-LOGIC-serie-quiz-storage"], ["F-001","F-010"], "feat(sito): home"],
  ["P1-ALLENAMENTO-UI-flashcard", "Flash-card run page", "allenamento", "UI", "M", ["P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-LOGIC-serie-quiz-storage","P1-ALLENAMENTO-UI-facce"], ["F-002","F-004"], "feat(allenamento): flash card"],
  ["P1-ALLENAMENTO-UI-quiz", "Quiz run page", "allenamento", "UI", "M", ["P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-LOGIC-serie-quiz-storage","P1-ALLENAMENTO-UI-facce"], ["F-003","F-004"], "feat(allenamento): quiz"],
  ["P1-ALLENAMENTO-UI-risultati", "Results page", "allenamento", "UI", "M", ["P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-LOGIC-serie-quiz-storage","P1-ALLENAMENTO-UI-facce"], ["F-010","F-004"], "feat(allenamento): risultati"],
  ["P1-SITO-UI-fonti", "Attribution page", "sito", "UI", "S", ["P1-MAZZI-BUILD-decks-e-pagine","P1-CONTENUTI-DATA-fonti-e-sezioni"], ["F-005"], "feat(sito): fonti"],
  ["P1-SITO-CONFIG-ci-deploy", "GitHub Actions workflow, dist checks, Pages deploy", "sito", "Config", "M", ["P1-SITO-CONFIG-scaffold","P1-CONTENUTI-TOOL-check-content","P1-MAZZI-BUILD-decks-e-pagine","P1-SITO-UI-home","P1-ALLENAMENTO-UI-flashcard","P1-ALLENAMENTO-UI-quiz","P1-ALLENAMENTO-UI-risultati","P1-SITO-UI-fonti"], ["F-009"], "chore(sito): CI e deploy"],
  ["P1-E2E-journey-prima-serie-di-flash-card", "Journey S-001", "Cross-cutting", "Test", "M", ["P1-SITO-UI-home","P1-ALLENAMENTO-UI-flashcard","P1-ALLENAMENTO-UI-facce","P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-UI-risultati","P1-ALLENAMENTO-LOGIC-serie-quiz-storage"], [], "test(e2e): journey S-001"],
  ["P1-E2E-journey-quiz-con-ripasso", "Journey S-002", "Cross-cutting", "Test", "M", ["P1-SITO-UI-home","P1-ALLENAMENTO-UI-quiz","P1-ALLENAMENTO-UI-flashcard","P1-ALLENAMENTO-UI-facce","P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-UI-risultati","P1-ALLENAMENTO-LOGIC-serie-quiz-storage"], [], "test(e2e): journey S-002"],
  ["P1-E2E-journey-righe-complete", "Journey S-003", "Cross-cutting", "Test", "M", ["P1-SITO-UI-home","P1-ALLENAMENTO-UI-flashcard","P1-ALLENAMENTO-UI-quiz","P1-ALLENAMENTO-UI-facce","P1-MAZZI-BUILD-decks-e-pagine","P1-ALLENAMENTO-UI-risultati","P1-ALLENAMENTO-LOGIC-serie-quiz-storage","P1-CONTENUTI-TOOL-generate-righe"], [], "test(e2e): journey S-003"],
];
const journeyStory: Record<string, string> = { "P1-E2E-journey-prima-serie-di-flash-card": "S-001", "P1-E2E-journey-quiz-con-ripasso": "S-002", "P1-E2E-journey-righe-complete": "S-003" };
const infra = new Set(["P1-SITO-CONFIG-scaffold", "P1-SITO-CONFIG-ci-deploy"]);

// Kahn levelling: wave = max(dep waves) + 1
const byId = new Map(decls.map(d => [d[0], d]));
const wave = new Map<string, number>();
let changed = true;
while (changed) {
  changed = false;
  for (const d of decls) {
    if (d[5].some(x => !wave.has(x))) continue;
    const w = d[5].length ? Math.max(...d[5].map(x => wave.get(x)!)) + 1 : 0;
    if (wave.get(d[0]) !== w) { wave.set(d[0], w); changed = true; }
  }
}
const missing = decls.filter(d => !wave.has(d[0])).map(d => d[0]);
if (missing.length) throw new Error("cycle or unknown dep: " + missing.join(", "));

const now = new Date().toISOString();
const old: TaskIndex | null = existsSync(INDEX_PATH) ? JSON.parse(readFileSync(INDEX_PATH, "utf8")) : null;
const oldById = new Map((old?.tasks ?? []).map(t => [t.id, t]));
const keep = (id: string, fresh: TaskEntry): TaskEntry => {
  const prev = oldById.get(id);
  return prev ? { ...fresh, status: prev.status, history: prev.history, notes: prev.notes } : fresh;
};
const tasks: TaskEntry[] = decls.map(([id, title, module, layer, effort, deps, features, commit]) => keep(id, {
  id, title, module, phase: 1, layer, status: "todo", wave: wave.get(id)!, effort,
  branch: "task/" + id.toLowerCase(), commitPrefix: commit, dependencies: deps,
  stories: journeyStory[id] ? [journeyStory[id]] : infra.has(id) ? [] : [...new Set(features.flatMap(f => S[f] ?? []))].sort(),
  features, spec_path: `akaaso/09-tasks/${id}.md`,
  history: [{ at: now, event: "created", note: "unpacked from the akaaso spec" }],
  notes: infra.has(id) ? "infrastructure: serves every story" : null,
}));
const maxWave = Math.max(...tasks.map(t => t.wave));
const gateChecks: Record<number, string> = {
  0: "scaffold builds and tests; parsers/extractors ran and their outputs are committed; contact sheets reviewed",
  1: "check:content green on the committed content (fixtures fail it); npm test green (logic + faces)",
  2: "generate.json committed at count 200; check:content regenerates and diffs clean",
  3: "build emits thirteen pages; e2e:smoke loads every page; check:dist passes",
  4: "all five pages implemented; e2e:smoke green; every state reachable per the artboards",
  5: "workflow green on develop→main; @critical journeys green under /orient/ and /; site answers at the Pages URL",
};
for (let w = 0; w <= maxWave; w++) {
  const impl = tasks.filter(t => t.wave === w && !t.id.startsWith("WAVE"));
  const id = `WAVE${w}-E2E-wave-gate`;
  tasks.push(keep(id, {
    id, title: `Wave ${w} post-merge gate`, module: "Cross-cutting", phase: 1, layer: "Test", status: "todo", wave: w, effort: "S",
    branch: "develop", commitPrefix: `test(gate): wave ${w} post-merge gate`, dependencies: impl.map(t => t.id), stories: [], features: [],
    spec_path: `akaaso/09-tasks/${id}.md`, history: [{ at: now, event: "created", note: "gate" }], notes: "runs inline on develop after the wave's merges; never a spawned agent",
  }));
  const body = `# ${id} — Wave ${w} post-merge gate

Runs **inline on \`develop\`** after every impl task of wave ${w} has merged.
Not a spawned agent. Red gate = wave not done.

## Checks

\`\`\`bash
npm ci
npm run check:content          # skip only while no content producer has landed (wave 0 before parsers)
npm test
VITE_BASE=/orient/ npm run build
npm run check:dist
npm run e2e:smoke              # from wave 3 on, when pages exist
npm run e2e -- --grep @critical   # wave 5
grep -rn '^<<<<<<<\\|^>>>>>>>' src scripts content akaaso/09-tasks e2e || true   # must print nothing
\`\`\`

Wave-specific: ${gateChecks[w] ?? "all of the above"}.

## Done Criteria

1. Every command above that applies to this wave exits 0 on \`develop\`.
2. No conflict marker anywhere in the tree.
3. The summary (commands run, counts, durations) is added to this task's history via \`bun scripts/tasks/status.ts addHistory ${id} gate "<summary>"\`.
`;
  writeFileSync(`akaaso/09-tasks/${id}.md`, body);
}
tasks.sort((a, b) => a.wave - b.wave || (a.id.startsWith("WAVE") ? 1 : 0) - (b.id.startsWith("WAVE") ? 1 : 0) || a.id.localeCompare(b.id));
const index: TaskIndex = { v: 1, project: "orient", generated: now, tasks };
writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");
console.log(`index: ${tasks.length} tasks, waves 0..${maxWave}`);
