// Task index schema — hand validation (no deps). Canonical file: akaaso/09-tasks/_index.json
export type Status = "todo" | "in-progress" | "done" | "blocked" | "skipped";
export type Layer = "Config" | "Content" | "Build" | "Logic" | "UI" | "Test";
export type Effort = "S" | "M" | "L";
export interface HistoryEntry { at: string; event: string; note?: string }
export interface TaskEntry {
  id: string; title: string; module: string; phase: number; layer: Layer; status: Status;
  wave: number; effort: Effort; branch: string; commitPrefix: string; dependencies: string[];
  stories: string[]; features: string[]; spec_path: string; history: HistoryEntry[]; notes: string | null;
}
export interface TaskIndex { v: 1; project: string; generated: string; tasks: TaskEntry[] }
export const STATUSES: Status[] = ["todo", "in-progress", "done", "blocked", "skipped"];
export const LAYERS: Layer[] = ["Config", "Content", "Build", "Logic", "UI", "Test"];
export const INDEX_PATH = "akaaso/09-tasks/_index.json";
