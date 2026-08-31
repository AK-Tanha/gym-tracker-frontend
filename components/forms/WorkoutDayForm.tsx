"use client";

import { useState } from "react";
import { WorkoutDay, PlannedExercise } from "@/lib/types";
import { TextInput, Select, FormButton, FieldError } from "./primitives";
import ExerciseForm, { ExerciseList } from "./ExerciseForm";

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const EMPTY: Omit<WorkoutDay, "exercises"> = {
  dayLabel: "",
  category: "",
  dayOfWeek: 1,
  isRestDay: false,
};

export default function WorkoutDayForm({
  initial,
  onSave,
  submitting,
}: {
  initial?: WorkoutDay;
  onSave: (day: WorkoutDay) => void;
  submitting?: boolean;
}) {
  const [meta, setMeta] = useState<Omit<WorkoutDay, "exercises">>(
    initial
      ? { dayLabel: initial.dayLabel, category: initial.category ?? "", dayOfWeek: initial.dayOfWeek, isRestDay: initial.isRestDay }
      : EMPTY
  );
  const [exercises, setExercises] = useState<PlannedExercise[]>(initial?.exercises ?? []);
  const [grouped, setGrouped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Omit<WorkoutDay, "exercises">>(key: K, value: Omit<WorkoutDay, "exercises">[K]) => {
    setMeta((m) => ({ ...m, [key]: value }));
    setError(null);
  };

  const addExercise = (ex: PlannedExercise) => {
    setExercises((list) => [...list, ex]);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta.dayLabel.trim()) {
      setError("A workout title is required.");
      return;
    }
    if (!meta.isRestDay && exercises.length === 0) {
      setError("Add at least one exercise.");
      return;
    }
    onSave({ ...meta, dayLabel: meta.dayLabel.trim(), exercises });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextInput
        label="Workout title"
        placeholder="e.g. Chest + Triceps"
        value={meta.dayLabel}
        onChange={(e) => set("dayLabel", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Day of week"
          options={DAY_OPTIONS}
          value={String(meta.dayOfWeek)}
          onChange={(e) => set("dayOfWeek", parseInt(e.target.value, 10))}
        />
        <TextInput
          label="Category"
          placeholder="e.g. Push day"
          value={meta.category ?? ""}
          onChange={(e) => set("category", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2.5 rounded-[10px] bg-rubber-2 px-3.5 py-3">
        <input
          type="checkbox"
          checked={meta.isRestDay}
          onChange={(e) => set("isRestDay", e.target.checked)}
          className="h-4 w-4 accent-plate-red"
        />
        <span className="text-sm text-chalk">Rest day (no exercises)</span>
      </label>

      {!meta.isRestDay && (
        <div className="mt-2 flex flex-col gap-3">
          <label className="flex items-center gap-2.5 rounded-[10px] bg-rubber-2 px-3.5 py-3">
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => setGrouped(e.target.checked)}
              className="h-4 w-4 accent-plate-blue"
            />
            <span className="text-sm text-chalk">Edit exercises as supersets</span>
          </label>

          <div className="rounded-[14px] bg-rubber p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
              Add exercise
            </p>
            <ExerciseForm onChange={addExercise} isGrouped={grouped} groupLabel={false} />
          </div>

          <div className="rounded-[14px] bg-rubber p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
              Exercises ({exercises.length})
            </p>
            {exercises.length === 0 ? (
              <p className="text-xs text-chalk-faint">No exercises yet.</p>
            ) : (
              <ExerciseList
                exercises={exercises}
                onRemove={(id) => setExercises((l) => l.filter((x) => x.id !== id))}
              />
            )}
          </div>
        </div>
      )}

      <FieldError error={error} />
      <FormButton type="submit" loading={submitting} className="mt-1">
        Save workout
      </FormButton>
    </form>
  );
}
