"use client";

import { useQuery } from "@tanstack/react-query";
import { api, useApiMutation, useApiInvalidations, queryKeys } from "@/lib/api";
import { Program } from "@/lib/types";
import { useState } from "react";
import { Modal } from "@/components/forms/Modal";
import ProgramForm from "@/components/forms/ProgramForm";
import { FormButton } from "@/components/forms/primitives";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";

export default function ProgramsPage() {
  const { invalidate } = useApiInvalidations();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);

  const { data, isLoading } = useQuery<{ myWorkouts: Program[] }>({
    queryKey: queryKeys.programs,
    queryFn: () => api.get<{ myWorkouts: Program[] }>("/api/programs"),
  });

  const savePrograms = useApiMutation("/api/programs", "POST");
  const updateProgram = useApiMutation(`/api/programs/${editing?.id ?? ""}`, "PUT");
  const deleteProgram = useApiMutation(`/api/programs/${deleting?.id ?? ""}`, "DELETE");

  const myWorkouts = data?.myWorkouts ?? [];

  const persist = async (myWorkouts: Program[]) => {
    await savePrograms.mutateAsync({ myWorkouts });
    await invalidate(queryKeys.programs);
  };

  const activate = async (id: string) => {
    const updates = myWorkouts.map((p) => ({ ...p, isActive: p.id === id }));
    await persist(updates);
  };

  const createWorkout = async (program: Program) => {
    const next = { ...program, isOwn: true };
    await persist([...myWorkouts, next]);
    setCreating(false);
  };

  const saveEdit = async (program: Program) => {
    await updateProgram.mutateAsync(program as unknown as Record<string, unknown>);
    await invalidate(queryKeys.programs);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await deleteProgram.mutateAsync();
    await invalidate(queryKeys.programs);
    setDeleting(null);
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

      <p className="mb-2.5 mt-4 text-[13px] font-semibold text-chalk-dim">Your workouts</p>
      <div className="flex flex-col gap-3">
        {myWorkouts.length === 0 && (
          <p className="text-xs text-chalk-faint">No custom workouts yet.</p>
        )}
        {myWorkouts.map((w) => (
          <div key={w.id} className="rounded-[14px] bg-rubber px-4.5 py-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="font-display text-[17px] font-semibold text-chalk">
                {w.name}
                {w.isActive && (
                  <span className="ml-2 text-[11px] font-sans font-normal text-[#5DCAA5]">
                    · Active
                  </span>
                )}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(w)}
                  aria-label="Edit workout"
                  className="rounded-md p-1.5 text-chalk-faint hover:text-chalk"
                >
                  <IconPencil size={16} />
                </button>
                <button
                  onClick={() => setDeleting(w)}
                  aria-label="Delete workout"
                  className="rounded-md p-1.5 text-chalk-faint hover:text-plate-red"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {w.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-chalk-faint">
                {w.daysPerWeek} days/week
              </span>
              <button
                onClick={() => activate(w.id)}
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

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit workout">
        <ProgramForm
          initial={editing ?? undefined}
          onSave={saveEdit}
          submitting={updateProgram.isPending}
          submitLabel="Save changes"
        />
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete workout">
        <div>
          <p className="mb-5 text-sm leading-relaxed text-chalk-faint">
            Delete <b className="text-chalk">{deleting?.name}</b>? This cannot be undone.
          </p>
          <FormButton
            variant="danger"
            loading={deleteProgram.isPending}
            className="w-full"
            onClick={confirmDelete}
          >
            Delete workout
          </FormButton>
        </div>
      </Modal>
    </div>
  );
}
