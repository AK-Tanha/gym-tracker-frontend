"use client";

import { useState } from "react";
import { PlannedExercise, ExerciseType } from "@/lib/types";
import { TextInput, Select, FormButton, FieldError } from "./primitives";
import { IconPlus, IconTrash } from "@tabler/icons-react";

export type ExerciseDraft = Omit<PlannedExercise, "id">;

const EMPTY_EXERCISE: ExerciseDraft = {
  name: "",
  muscleGroup: "",
  type: "single",
  groupId: null,
  sets: 3,
  reps: 10,
  weight: 20,
  restBetweenSets: 90,
  restBetweenReps: 0,
};

const TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "superset", label: "Superset" },
  { value: "giant-set", label: "Giant set" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ExerciseForm({
  onChange,
  groupLabel,
  isGrouped,
}: {
  onChange: (exercise: PlannedExercise) => void;
  groupLabel?: boolean;
  isGrouped: boolean;
}) {
  const [draft, setDraft] = useState<ExerciseDraft>(EMPTY_EXERCISE);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Exercise name is required.");
      return;
    }
    if (isGrouped && !groupLabel) {
      setError("Give this superset group a label (e.g. SS-1).");
      return;
    }
    onChange({
      ...draft,
      id: uid(),
      groupId: isGrouped ? draft.groupId ?? `g-${uid()}` : null,
      name: draft.name.trim(),
      muscleGroup: draft.muscleGroup.trim() || "General",
    });
    setDraft(EMPTY_EXERCISE);
  };

  const num = (v: string): number => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextInput
        label="Exercise name"
        placeholder="e.g. Barbell bench press"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <TextInput
        label="Muscle group"
        placeholder="e.g. Chest"
        value={draft.muscleGroup}
        onChange={(e) => set("muscleGroup", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={draft.type}
          onChange={(e) => set("type", e.target.value as ExerciseType)}
        />
        <TextInput
          label="Sets"
          type="number"
          min={1}
          value={draft.sets}
          onChange={(e) => set("sets", num(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Reps"
          type="number"
          min={1}
          value={draft.reps}
          onChange={(e) => set("reps", num(e.target.value))}
        />
        <TextInput
          label="Weight (kg)"
          type="number"
          min={0}
          step="0.5"
          value={draft.weight}
          onChange={(e) => set("weight", parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Rest between sets (s)"
          type="number"
          min={0}
          value={draft.restBetweenSets}
          onChange={(e) => set("restBetweenSets", num(e.target.value))}
        />
        <TextInput
          label="Rest between reps (s)"
          type="number"
          min={0}
          value={draft.restBetweenReps}
          onChange={(e) => set("restBetweenReps", num(e.target.value))}
        />
      </div>
      {isGrouped && (
        <TextInput
          label="Group label"
          placeholder="e.g. SS-1"
          value={draft.groupLabel ?? ""}
          onChange={(e) => set("groupLabel", e.target.value)}
        />
      )}
      <FieldError error={error} />
      <FormButton type="submit" variant="success" className="mt-1">
        <IconPlus size={16} /> Add exercise
      </FormButton>
    </form>
  );
}

export function ExerciseList({
  exercises,
  onRemove,
}: {
  exercises: PlannedExercise[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className="flex items-center justify-between rounded-[10px] bg-rubber-2 px-3.5 py-2.5"
        >
          <div>
            <p className="text-sm font-medium text-chalk">{ex.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-chalk-faint">
              {ex.muscleGroup} · {ex.weight}kg × {ex.reps} · {ex.sets} sets
              {ex.groupLabel ? ` · ${ex.groupLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(ex.id)}
            className="rounded-md p-1.5 text-chalk-faint hover:text-plate-red"
            aria-label={`Remove ${ex.name}`}
          >
            <IconTrash size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
