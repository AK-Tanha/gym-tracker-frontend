"use client";

import { useState } from "react";
import { TextInput, Select, FormButton, FieldError } from "./primitives";
import { ExerciseUnit } from "@/lib/types";
import { useUnits } from "@/components/UnitsProvider";
import { fmt } from "@/lib/units";

export type LoggedSet = {
  id?: string;
  weight: number;
  reps: number;
  duration: number;
  unit: ExerciseUnit;
  rpe: number | null;
  notes: string;
  exerciseName?: string;
  muscleGroup?: string;
  setNumber?: number;
};

const EMPTY: LoggedSet = { weight: 0, reps: 0, duration: 0, unit: "reps", rpe: null, notes: "" };

export default function LogSetForm({
  unit = "reps",
  suggestedWeight,
  suggestedReps,
  suggestedDuration,
  onDone,
  submitting,
}: {
  unit?: ExerciseUnit;
  suggestedWeight: number;
  suggestedReps: number;
  suggestedDuration: number;
  onDone: (set: LoggedSet) => void;
  submitting?: boolean;
}) {
  const { unit: weightUnit, toUnit, toKg } = useUnits();
  const [set, setSet] = useState<LoggedSet>({
    weight: suggestedWeight,
    reps: suggestedReps,
    duration: suggestedDuration,
    unit,
    rpe: null,
    notes: "",
  });
  const [weightInput, setWeightInput] = useState(() => fmt(toUnit(suggestedWeight)));
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unit === "reps") {
      if (set.reps < 1) {
        setError("Enter reps completed.");
        return;
      }
    } else if (set.duration < 1) {
      setError("Enter seconds completed.");
      return;
    }
    const w = parseFloat(weightInput);
    onDone({ ...set, weight: Number.isNaN(w) ? 0 : toKg(w) });
    setSet({ ...EMPTY, unit });
    setWeightInput("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label={`Weight (${weightUnit})`}
          type="number"
          min={0}
          step="0.5"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
        />
        {unit === "reps" ? (
          <TextInput
            label="Reps"
            type="number"
            min={1}
            value={set.reps}
            onChange={(e) => setSet((s) => ({ ...s, reps: parseInt(e.target.value, 10) || 0 }))}
          />
        ) : (
          <TextInput
            label="Time (s)"
            type="number"
            min={1}
            value={set.duration}
            onChange={(e) => setSet((s) => ({ ...s, duration: parseInt(e.target.value, 10) || 0 }))}
          />
        )}
      </div>
      <Select
        label="RPE (optional)"
        options={[
          { value: "", label: "—" },
          ...[6, 7, 8, 9, 10].map((r) => ({ value: String(r), label: `${r} RPE` })),
        ]}
        value={set.rpe === null ? "" : String(set.rpe)}
        onChange={(e) =>
          setSet((s) => ({
            ...s,
            rpe: e.target.value === "" ? null : parseInt(e.target.value, 10),
          }))
        }
      />
      <TextInput
        label="Notes (optional)"
        placeholder="e.g. felt heavy"
        value={set.notes}
        onChange={(e) => setSet((s) => ({ ...s, notes: e.target.value }))}
      />
      <FieldError error={error} />
      <FormButton type="submit" variant="success" loading={submitting}>
        Log set
      </FormButton>
    </form>
  );
}
