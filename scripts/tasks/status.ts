// bun scripts/tasks/status.ts setStatus <ID> <status> | addHistory <ID> <event> "<note>" | show
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { INDEX_PATH, STATUSES, type TaskIndex, type Status } from "./_schema.ts";
const [cmd, id, a, b] = process.argv.slice(2);
const idx: TaskIndex = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
const t = idx.tasks.find(x => x.id === id);
if (cmd === "show") { for (const x of idx.tasks) console.log(`${x.wave}\t${x.status.padEnd(11)}\t${x.id}`); process.exit(0); }
if (!t) { console.error("unknown task", id); process.exit(1); }
if (cmd === "setStatus") { if (!STATUSES.includes(a as Status)) { console.error("bad status"); process.exit(1); } t.status = a as Status; t.history.push({ at: new Date().toISOString(), event: "status", note: a }); }
else if (cmd === "addHistory") { t.history.push({ at: new Date().toISOString(), event: a, note: b }); }
else { console.error("usage: setStatus|addHistory|show"); process.exit(1); }
writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + "\n");
execSync("bun scripts/tasks/regenerate-views.ts", { stdio: "inherit" });
