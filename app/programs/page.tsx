"use client";

import { useQuery } from "@tanstack/react-query";
import { api, useApiMutation, useApiInvalidations, queryKeys } from "@/lib/api";
import { Program } from "@/lib/types";
import { useState } from "react";
import { Modal } from "@/components/forms/Modal";
import ProgramForm from "@/components/forms/ProgramForm";
import { IconPlus } from "@tabler/icons-react";

type ProgramsDoc = { programs: Program[]; myWorkouts: Program[] };

export default function ProgramsPage() {
  const { invalidate } = useApiInvalidations();
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery<ProgramsDoc>({
    queryKey: queryKeys.programs,
    queryFn: () => api.get<ProgramsDoc>("/api/programs"),
  });

  const savePrograms = useApiMutation("/api/programs", "POST");

  const programs = data?.programs ?? [];
  const myWorkouts = data?.myWorkouts ?? [];

  const persist = async (programs: Program[], myWorkouts: Program[]) => {
    await savePrograms.mutateAsync({ programs, myWorkouts });
    await invalidate(queryKeys.programs);
  };

  const activate = async (id: string, isOwn: boolean) => {
    const list = isOwn ? myWorkouts : programs;
    const updates = list.map((p) => ({ ...p, isActive: p.id === id }));
    const payload = isOwn
      ? { programs, myWorkouts: updates }
      : { programs: updates, myWorkouts };
    await persist(payload.programs, payload.myWorkouts);
  };

  const createWorkout = async (program: Program) => {
    const next = { ...program, isOwn: true };
    await persist(programs, [...myWorkouts, next]);
    setCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
            Browse
          </p>
          <h1 className="font-display text-[24px] font-bold text-chalk">Programs</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-[10px] bg-plate-red px-3.5 py-2.5 text-xs font-semibold text-white"
        >
          <IconPlus size={15} /> New
        </button>
      </div>

      <p className="mb-2.5 mt-4 text-[13px] font-semibold text-chalk-dim">
        Superadmin programs
      </p>
      <div className="flex flex-col gap-3">
        {programs.map((p) => (
          <div key={p.id} className="rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {p.name}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {p.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-chalk-faint">
                {p.daysPerWeek} days/week
              </span>
              <button
                onClick={() => activate(p.id, false)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  p.isActive
                    ? "bg-plate-green text-white"
                    : "border border-plate-blue text-[#7FB2E8]"
                }`}
              >
                {p.isActive ? "Active" : "Use program"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Your workouts
      </p>
      <div className="flex flex-col gap-3">
        {myWorkouts.length === 0 && (
          <p className="text-xs text-chalk-faint">No custom workouts yet.</p>
        )}
        {myWorkouts.map((w) => (
          <div key={w.id} className="rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {w.name}
              {w.isActive && (
                <span className="ml-2 text-[11px] font-sans font-normal text-[#5DCAA5]">
                  · Active
                </span>
              )}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {w.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-chalk-faint">
                {w.daysPerWeek} days/week
              </span>
              <button
                onClick={() => activate(w.id, true)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  w.isActive
                    ? "bg-plate-green text-white"
                    : "border border-plate-blue text-[#7FB2E8]"
                }`}
              >
                {w.isActive ? "Active" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New workout">
        <ProgramForm
          onSave={createWorkout}
          submitting={savePrograms.isPending}
          submitLabel="Create workout"
        />
      </Modal>
    </div>
  );
}
