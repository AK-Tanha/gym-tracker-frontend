export type LoggedSetEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  unit: "reps" | "time";
  weight: number;
  reps: number;
  duration: number;
  rpe: number | null;
  notes: string;
  date: string;
};

/**
 * An `id` identifies exactly one log entry. Concurrent POSTs used to append
 * the same id twice, so readers drop any row whose id they have already seen
 * instead of showing (and counting) it twice.
 */
export function dedupeEntriesById(entries: LoggedSetEntry[]): LoggedSetEntry[] {
  const seen = new Set<string>();
  const out: LoggedSetEntry[] = [];
  for (const e of entries) {
    if (e.id && seen.has(e.id)) continue;
    if (e.id) seen.add(e.id);
    out.push(e);
  }
  return out;
}
