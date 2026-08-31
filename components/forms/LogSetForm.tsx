"use client";

import { useState } from "react";
import { TextInput, Select, FormButton, FieldError } from "./primitives";

export type LoggedSet = {
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string;
};

const EMPTY: LoggedSet = { weight: 0, reps: 0, rpe: null, notes: "" };

export default function LogSetForm({
  suggestedWeight,
  suggestedReps,
  onDone,
  submitting,
}: {
  suggestedWeight: number;
  suggestedReps: number;
  onDone: (set: LoggedSet) => void;
  submitting?: boolean;
}) {
  const [set, setSet] = useState<LoggedSet>({
    weight: suggestedWeight,
    reps: suggestedReps,
    rpe: null,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (set.reps < 1) {
      setError("Enter reps completed.");
      return;
    }
    onDone(set);
    setSet(EMPTY);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Weight (kg)"
          type="number"
          min={0}
          step="0.5"
          value={set.weight}
          onChange={(e) => setSet((s) => ({ ...s, weight: parseFloat(e.target.value) || 0 }))}
        />
        <TextInput
          label="Reps"
          type="number"
          min={1}
          value={set.reps}
          onChange={(e) => setSet((s) => ({ ...s, reps: parseInt(e.target.value, 10) || 0 }))}
        />
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
