"use client";

import { useState } from "react";
import { Program } from "@/lib/types";
import { TextInput, TextArea, Select, FormButton, FieldError } from "./primitives";

const EMPTY: Omit<Program, "id"> = {
  name: "",
  description: "",
  daysPerWeek: 3,
  isOwn: true,
};

export default function ProgramForm({
  initial,
  onSave,
  submitting,
  submitLabel = "Save program",
}: {
  initial?: Program;
  onSave: (program: Program) => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [draft, setDraft] = useState<Omit<Program, "id">>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          daysPerWeek: initial.daysPerWeek,
          isOwn: initial.isOwn ?? true,
        }
      : EMPTY
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Omit<Program, "id">>(key: K, value: Omit<Program, "id">[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Program name is required.");
      return;
    }
    onSave({ ...draft, id: initial?.id ?? Math.random().toString(36).slice(2, 10), name: draft.name.trim() });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextInput
        label="Program name"
        placeholder="e.g. My Push Pull Legs"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <TextArea
        label="Description"
        placeholder="Short summary of the program"
        rows={3}
        value={draft.description}
        onChange={(e) => set("description", e.target.value)}
      />
      <Select
        label="Days per week"
        options={[3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d} days` }))}
        value={String(draft.daysPerWeek)}
        onChange={(e) => set("daysPerWeek", parseInt(e.target.value, 10))}
      />
      <FieldError error={error} />
      <FormButton type="submit" loading={submitting} className="mt-1">
        {submitLabel}
      </FormButton>
    </form>
  );
}
