"use client";

import { useState } from "react";
import { TextInput, Select, FormButton } from "@/components/forms/primitives";

type AdminUserInput = {
  name: string;
  email: string;
  password: string;
  units: string;
  role: string;
};

export default function AdminUserForm({
  initial,
  onSubmit,
  submitting,
  mode = "create",
}: {
  initial?: AdminUserInput;
  onSubmit: (input: AdminUserInput) => void | Promise<void>;
  submitting: boolean;
  mode?: "create" | "edit";
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [units, setUnits] = useState(initial?.units ?? "kg");
  const [role, setRole] = useState(initial?.role ?? "user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, password, units, role });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="John Doe"
      />
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="john@example.com"
      />
      {mode === "create" ? (
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Min 8 characters"
        />
      ) : (
        <TextInput
          label="New Password (leave blank to keep)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="Min 8 characters"
        />
      )}
      <Select
        label="Units"
        value={units}
        onChange={(e) => setUnits(e.target.value)}
        options={[
          { value: "kg", label: "Kilograms (kg)" },
          { value: "lbs", label: "Pounds (lbs)" },
        ]}
      />
      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { value: "user", label: "User" },
          { value: "superadmin", label: "Superadmin" },
        ]}
      />
      <FormButton
        variant="primary"
        type="submit"
        loading={submitting}
        disabled={
          !name ||
          !email ||
          (mode === "create" && password.length < 8)
        }
        className="mt-1"
      >
        {mode === "create" ? "Create User" : "Save Changes"}
      </FormButton>
    </form>
  );
}
