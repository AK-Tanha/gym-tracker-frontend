import { ExecutionStep, PlannedExercise } from "./types";
import { LoggedSet } from "@/components/forms/LogSetForm";

const STORAGE_KEY = "statfit_active_workout";

export type PersistedWorkout = {
  date: string;
  index: number;
  completedSets: string[];
  pendingSets: ExecutionStep[];
  exerciseOrder: PlannedExercise[];
  queue: ExecutionStep[];
  loggedSets: LoggedSet[];
};

export function saveWorkoutState(state: Omit<PersistedWorkout, "date">) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload: PersistedWorkout = { ...state, date: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadWorkoutState(): PersistedWorkout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedWorkout = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearWorkoutState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
