"use client";

import { useState } from "react";
import { TextInput, FormButton } from "./primitives";

export default function BodyWeightForm({
  unit,
  onSubmit,
  submitting,
}: {
  unit: "kg" | "lbs";
  onSubmit: (weight: number, date: string) => void;
  submitting?: boolean;
}) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (w <= 0 || Number.isNaN(w)) return;
    onSubmit(w, date);
    setWeight("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextInput
        label={`Body weight (${unit})`}
        type="number"
        min={0}
        step="0.1"
        placeholder={`e.g. ${unit === "kg" ? "82.5" : "182"}`}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <TextInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <FormButton type="submit" loading={submitting}>
        Log weight
      </FormButton>
    </form>
  );
}
