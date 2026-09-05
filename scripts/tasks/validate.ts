import { readFileSync, existsSync } from "node:fs";
import { INDEX_PATH, STATUSES, LAYERS, type TaskIndex } from "./_schema.ts";
const idx: TaskIndex = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
const errors: string[] = []; const warn: string[] = [];
const ids = new Set<string>(); const byId = new Map(idx.tasks.map(t => [t.id, t]));
for (const t of idx.tasks) {
  if (ids.has(t.id)) errors.push(`duplicate id ${t.id}`); ids.add(t.id);
  for (const k of ["id","title","module","layer","status","wave","effort","branch","commitPrefix","dependencies","stories","spec_path","history"]) if (!(k in t)) errors.push(`${t.id}: missing ${k}`);
  if (!STATUSES.includes(t.status)) errors.push(`${t.id}: bad status ${t.status}`);
  if (!LAYERS.includes(t.layer)) errors.push(`${t.id}: bad layer ${t.layer}`);
  if (!existsSync(t.spec_path)) errors.push(`${t.id}: task file ${t.spec_path} missing`);
  for (const d of t.dependencies) {
    const dep = byId.get(d);
    if (!dep) { errors.push(`${t.id}: unknown dependency ${d}`); continue; }
    if (!t.id.startsWith("WAVE") && !dep.id.startsWith("WAVE") && dep.wave === t.wave) errors.push(`INTRA-WAVE: wave ${t.wave}: ${t.id} <- ${d}`);
    if (!t.id.startsWith("WAVE") && dep.wave > t.wave) errors.push(`${t.id} (wave ${t.wave}) depends on later ${d} (wave ${dep.wave})`);
  }
  if (!t.stories.length && !t.id.startsWith("WAVE") && !(t.notes ?? "").startsWith("infrastructure")) warn.push(`${t.id}: serves no story and is not marked infrastructure`);
}
for (const w of new Set(idx.tasks.map(t => t.wave))) if (!byId.has(`WAVE${w}-E2E-wave-gate`)) errors.push(`wave ${w} has no gate task`);
warn.forEach(w => console.warn("warn:", w));
if (errors.length) { errors.forEach(e => console.error("error:", e)); process.exit(1); }
console.log(`✓ index valid: ${idx.tasks.length} tasks, no intra-wave impl dependencies`);
