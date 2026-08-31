"use client";

import { useState } from "react";
import { TextInput, FormButton } from "./primitives";

export type ProfileInput = {
  name: string;
  initials: string;
};

export default function EditProfileForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial: ProfileInput;
  onSubmit: (profile: ProfileInput) => void;
  submitting?: boolean;
}) {
  const [draft, setDraft] = useState<ProfileInput>({
    name: initial.name,
    initials: initial.initials,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: draft.name.trim() || initial.name,
      initials: draft.initials.trim().slice(0, 2).toUpperCase() || initial.initials,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <TextInput
        label="Display name"
        placeholder="e.g. AK Tanha"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
      />
      <TextInput
        label="Initials"
        maxLength={2}
        placeholder="e.g. AK"
        value={draft.initials}
        onChange={(e) => setDraft((d) => ({ ...d, initials: e.target.value }))}
      />
      <FormButton type="submit" loading={submitting}>
        Save profile
      </FormButton>
    </form>
  );
}
