"use client";

import { useState } from "react";
import { PlannedExercise, ExerciseType, ExerciseUnit } from "@/lib/types";
import {
  TextInput,
  Select,
  FormButton,
  FieldError,
  StepperInput,
} from "./primitives";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconArrowUp,
  IconArrowDown,
  IconCopy,
} from "@tabler/icons-react";
import { suggestionsFor } from "@/lib/exerciseLibrary";
import { useUnits } from "@/components/UnitsProvider";

export type ExerciseDraft = Omit<PlannedExercise, "id">;

const EMPTY_EXERCISE: ExerciseDraft = {
  name: "",
  muscleGroup: "",
  type: "single",
  groupId: null,
  unit: "reps",
  sets: 3,
  reps: 10,
  duration: 60,
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

const UNIT_OPTIONS = [
  { value: "reps", label: "Reps" },
  { value: "time", label: "Time" },
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
          unit: initial.unit ?? "reps",
          sets: initial.sets,
          reps: initial.reps,
          duration: initial.duration ?? 60,
          weight: initial.weight,
          isFreeWeight: initial.isFreeWeight ?? false,
          restBetweenSets: initial.restBetweenSets,
          restBetweenReps: initial.restBetweenReps,
          notes: initial.notes ?? "",
        }
      : EMPTY_EXERCISE,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { unit, toUnit, toKg, stepFromKg } = useUnits();

  const set = <K extends keyof ExerciseDraft>(
    key: K,
    value: ExerciseDraft[K],
  ) => {
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
      groupId: isGrouped ? (draft.groupId ?? `g-${uid()}`) : null,
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
        <Select
          label="Reps / Time"
          options={UNIT_OPTIONS}
          value={draft.unit}
          onChange={(e) => set("unit", e.target.value as ExerciseUnit)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StepperInput
          label="Sets"
          min={1}
          value={draft.sets}
          onChange={(n) => set("sets", n)}
        />
        {draft.unit === "reps" ? (
          <StepperInput
            label="Reps"
            min={1}
            value={draft.reps}
            onChange={(n) => set("reps", n)}
          />
        ) : (
          <StepperInput
            label="Time (s)"
            min={1}
            step={5}
            value={draft.duration}
            onChange={(n) => set("duration", n)}
          />
        )}
      </div>
      <div className="grid grid-cols-2 items-start gap-3">
        <StepperInput
          label={`Weight (${unit})`}
          min={0}
          step={stepFromKg(2.5)}
          format={(n) => {
            const r = Math.round(n * 10) / 10;
            return Number.isInteger(r) ? String(r) : r.toFixed(1);
          }}
          value={draft.isFreeWeight ? 0 : toUnit(draft.weight)}
          onChange={(n) => {
            if (!draft.isFreeWeight) set("weight", toKg(n) || 0);
          }}
        />
      <div className="flex items-center self-end pb-3">
        <input
          id="isFreeWeight"
          type="checkbox"
          checked={draft.isFreeWeight}
          onChange={(e) => {
            set("isFreeWeight", e.target.checked);
            if (e.target.checked) set("weight", 0);
          }}
          className="h-4 w-4 accent-plate-red"
        />
        <label
          htmlFor="isFreeWeight"
          className="select-none ms-2 text-sm font-medium text-heading"
        >
          Free weight
        </label>
      </div>
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
      <FormButton
        type="button"
        variant="success"
        className="mt-1"
        onClick={submit}
      >
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
  const { unit, display } = useUnits();

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((ex, idx) => (
        <div
          key={ex.id}
          className="card-3d rounded-[10px] bg-rubber-2 px-3.5 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-chalk">
                {ex.name}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-chalk-faint">
                {ex.muscleGroup} ·{" "}
                {ex.unit === "time"
                  ? `${ex.weight > 0 ? `${display(ex.weight)}${unit} · ` : ""}${ex.duration}s hold`
                  : `${display(ex.weight)}${unit} × ${ex.reps} reps`}{" "}
                · {ex.sets} sets
                {ex.groupLabel ? ` · ${ex.groupLabel}` : ""}
              </p>
              {ex.notes && (
                <p className="mt-1 text-[11px] italic text-chalk-dim">
                  {ex.notes}
                </p>
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
