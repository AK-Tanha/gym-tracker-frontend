"use client";

import { useState } from "react";
import { PlannedExercise, ExerciseType } from "@/lib/types";
import { TextInput, Select, FormButton, FieldError, StepperInput } from "./primitives";
import { IconPlus, IconTrash, IconPencil, IconArrowUp, IconArrowDown, IconCopy } from "@tabler/icons-react";
import { suggestionsFor } from "@/lib/exerciseLibrary";

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
  notes: "",
};

const TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "superset", label: "Superset" },
  { value: "giant-set", label: "Giant set" },
];

const REST_PRESETS = [45, 60, 90, 120, 180];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ExerciseForm({
  onChange,
  groupLabel,
  isGrouped,
  initial,
  editingId,
}: {
  onChange: (exercise: PlannedExercise) => void;
  groupLabel?: boolean;
  isGrouped: boolean;
  initial?: PlannedExercise;
  editingId?: string | null;
}) {
  const [draft, setDraft] = useState<ExerciseDraft>(
    initial
      ? {
          name: initial.name,
          muscleGroup: initial.muscleGroup,
          type: initial.type,
          groupId: initial.groupId,
          groupLabel: initial.groupLabel ?? "",
          sets: initial.sets,
          reps: initial.reps,
          weight: initial.weight,
          restBetweenSets: initial.restBetweenSets,
          restBetweenReps: initial.restBetweenReps,
          notes: initial.notes ?? "",
        }
      : EMPTY_EXERCISE
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const pickSuggestion = (name: string, muscleGroup: string) => {
    set("name", name);
    if (!draft.muscleGroup.trim()) set("muscleGroup", muscleGroup);
    setShowSuggestions(false);
  };

  const submit = () => {
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
      id: editingId ?? uid(),
      groupId: isGrouped ? draft.groupId ?? `g-${uid()}` : null,
      name: draft.name.trim(),
      muscleGroup: draft.muscleGroup.trim() || "General",
      notes: (draft.notes ?? "").trim() || undefined,
    });
    setDraft(EMPTY_EXERCISE);
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <TextInput
          label="Exercise name"
          placeholder="e.g. Barbell bench press"
          value={draft.name}
          onChange={(e) => {
            set("name", e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && draft.name.trim() !== "" && (
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-[10px] border border-rubber-2 bg-rubber shadow-lg">
            {suggestionsFor(draft.name).map((s) => (
              <button
                key={s.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickSuggestion(s.name, s.muscleGroup);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-chalk hover:bg-rubber-2"
              >
                <span>{s.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
                  {s.muscleGroup}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
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
        <StepperInput
          label="Sets"
          min={1}
          value={draft.sets}
          onChange={(n) => set("sets", n)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StepperInput
          label="Reps"
          min={1}
          value={draft.reps}
          onChange={(n) => set("reps", n)}
        />
        <StepperInput
          label="Weight (kg)"
          min={0}
          step={2.5}
          format={(n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))}
          value={draft.weight}
          onChange={(n) => set("weight", n)}
        />
      </div>
      <div>
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
          Rest between sets (s)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {REST_PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => set("restBetweenSets", sec)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                draft.restBetweenSets === sec
                  ? "bg-plate-red text-white"
                  : "bg-rubber-2 text-chalk-dim hover:text-chalk"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
        <div className="mt-1.5">
          <StepperInput
            value={draft.restBetweenSets}
            min={0}
            onChange={(n) => set("restBetweenSets", n)}
          />
        </div>
      </div>
      <StepperInput
        label="Rest between reps (s)"
        min={0}
        value={draft.restBetweenReps}
        onChange={(n) => set("restBetweenReps", n)}
      />
      <TextInput
        label="Notes (tempo, form cues)"
        placeholder="e.g. 2-1-2 tempo, keep elbows tucked"
        value={draft.notes ?? ""}
        onChange={(e) => set("notes", e.target.value)}
      />
      {isGrouped && (
        <TextInput
          label="Group label"
          placeholder="e.g. SS-1"
          value={draft.groupLabel ?? ""}
          onChange={(e) => set("groupLabel", e.target.value)}
        />
      )}
      <FieldError error={error} />
      <FormButton type="button" variant="success" className="mt-1" onClick={submit}>
        <IconPlus size={16} /> {isEditing ? "Update exercise" : "Add exercise"}
      </FormButton>
    </div>
  );
}

export function ExerciseList({
  exercises,
  onRemove,
  onReorder,
  onEdit,
  onDuplicate,
}: {
  exercises: PlannedExercise[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}) {
  const iconBtn =
    "rounded-md p-1.5 text-chalk-faint transition hover:text-chalk disabled:opacity-30 disabled:hover:text-chalk-faint";

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex, idx) => (
        <div
          key={ex.id}
          className="rounded-[10px] bg-rubber-2 px-3.5 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-chalk">{ex.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-chalk-faint">
                {ex.muscleGroup} · {ex.weight}kg × {ex.reps} · {ex.sets} sets
                {ex.groupLabel ? ` · ${ex.groupLabel}` : ""}
              </p>
              {ex.notes && (
                <p className="mt-1 text-[11px] italic text-chalk-dim">{ex.notes}</p>
              )}
            </div>
            <div
              className="flex items-center gap-1"
              onMouseDown={(e) => e.preventDefault()}
            >
              {onReorder && (
                <>
                  <button
                    type="button"
                    className={iconBtn}
                    disabled={idx === 0}
                    onClick={() => onReorder(idx, idx - 1)}
                    aria-label="Move up"
                  >
                    <IconArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    disabled={idx === exercises.length - 1}
                    onClick={() => onReorder(idx, idx + 1)}
                    aria-label="Move down"
                  >
                    <IconArrowDown size={15} />
                  </button>
                </>
              )}
              {onDuplicate && (
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => onDuplicate(ex.id)}
                  aria-label="Duplicate"
                >
                  <IconCopy size={15} />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => onEdit(ex.id)}
                  aria-label={`Edit ${ex.name}`}
                >
                  <IconPencil size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(ex.id)}
                className={`${iconBtn} hover:text-plate-red`}
                aria-label={`Remove ${ex.name}`}
              >
                <IconTrash size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
