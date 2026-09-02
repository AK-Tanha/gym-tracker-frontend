"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, useApiMutation, useApiInvalidations, queryKeys } from "@/lib/api";
import { Program, WorkoutDay } from "@/lib/types";
import { useState } from "react";
import { Modal } from "@/components/forms/Modal";
import ProgramForm from "@/components/forms/ProgramForm";
import WorkoutDayForm from "@/components/forms/WorkoutDayForm";
import { FormButton } from "@/components/forms/primitives";
import { DAY_NAMES } from "@/lib/todayWorkout";
import { IconPlus, IconPencil, IconTrash, IconChevronDown } from "@tabler/icons-react";

export default function ProgramsPage() {
  const { invalidate } = useApiInvalidations();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dayTarget, setDayTarget] = useState<{ program: Program; day?: WorkoutDay } | null>(null);
  const [viewingDay, setViewingDay] = useState<{ program: Program; day: WorkoutDay } | null>(null);

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
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
  };

  const activate = async (id: string) => {
    const updates = myWorkouts.map((p) => ({ ...p, isActive: p.id === id }));
    await persist(updates);
  };

  const createWorkout = async (program: Program) => {
    const next = { ...program, isOwn: true, workoutDays: [] };
    await persist([...myWorkouts, next]);
    setCreating(false);
  };

  const saveEdit = async (program: Program) => {
    await updateProgram.mutateAsync(program as unknown as Record<string, unknown>);
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await deleteProgram.mutateAsync();
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
    setDeleting(null);
  };

  const saveDay = async (day: WorkoutDay) => {
    if (!dayTarget) return;
    const id = dayTarget.program.id;
    const cached = queryClient.getQueryData<{ myWorkouts: Program[] }>(queryKeys.programs);
    const current =
      cached?.myWorkouts?.find((p) => p.id === id) ?? dayTarget.program;
    const program = { ...current, workoutDays: current.workoutDays ?? [] };
    const days = program.workoutDays ?? [];
    const exists = days.some((d) => d.dayOfWeek === day.dayOfWeek);
    const updatedDays = exists
      ? days.map((d) => (d.dayOfWeek === day.dayOfWeek ? day : d))
      : [...days, day];
    await api.put(`/api/programs/${program.id}`, {
      workoutDays: updatedDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    });
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
    setDayTarget(null);
  };

  const deleteDay = async (program: Program, dow: number) => {
    await api.put(`/api/programs/${program.id}`, {
      workoutDays: (program.workoutDays ?? []).filter((d) => d.dayOfWeek !== dow),
    });
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
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

      <p className="mb-2.5 mt-4 text-[13px] font-semibold text-chalk-dim">Your programs</p>
      <div className="flex flex-col gap-3">
        {myWorkouts.length === 0 && (
          <p className="text-xs text-chalk-faint">No programs yet.</p>
        )}
        {myWorkouts.map((w) => (
          <div key={w.id} className="card-3d rounded-[14px] bg-rubber px-4.5 py-4">
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
                  onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                  aria-label="Toggle workout days"
                  className="rounded-md p-1.5 text-chalk-faint hover:text-chalk"
                >
                  <IconChevronDown
                    size={16}
                    className={`transition-transform ${expanded === w.id ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setEditing(w)}
                  aria-label="Edit program"
                  className="rounded-md p-1.5 text-chalk-faint hover:text-chalk"
                >
                  <IconPencil size={16} />
                </button>
                <button
                  onClick={() => setDeleting(w)}
                  aria-label="Delete program"
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
                {w.daysPerWeek} days/week · {(w.workoutDays ?? []).length} built days
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

            {expanded === w.id && (
              <div className="card-3d mt-4 rounded-[12px] bg-rubber-2 p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-chalk-dim">
                    Workout days
                  </p>
                  <button
                    onClick={() => setDayTarget({ program: w })}
                    className="flex items-center gap-1 rounded-lg bg-plate-red px-2.5 py-1.5 text-[11px] font-semibold text-white"
                  >
                    <IconPlus size={13} /> Add day
                  </button>
                </div>

                {(w.workoutDays ?? []).length === 0 ? (
                  <p className="text-xs text-chalk-faint">No workout days yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(w.workoutDays ?? [])
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((day) => (
                        <div
                          key={day.dayOfWeek}
                          className="card-3d flex items-center justify-between rounded-[10px] bg-rubber px-3 py-2"
                        >
                          <button
                            onClick={() => setViewingDay({ program: w, day })}
                            className="flex flex-1 items-center justify-between text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-chalk">
                                {DAY_NAMES[day.dayOfWeek] ?? day.dayLabel}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-chalk-faint">
                                {day.dayLabel}
                                {day.isRestDay
                                  ? " · Rest day"
                                  : ` · ${day.exercises.length} exercises${
                                      day.category ? ` · ${day.category}` : ""
                                    }`}
                              </p>
                            </div>
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setDayTarget({ program: w, day })}
                              className="rounded-md p-1.5 text-chalk-faint hover:text-chalk"
                              aria-label="Edit day"
                            >
                              <IconPencil size={15} />
                            </button>
                            <button
                              onClick={() => deleteDay(w, day.dayOfWeek)}
                              className="rounded-md p-1.5 text-chalk-faint hover:text-plate-red"
                              aria-label="Delete day"
                            >
                              <IconTrash size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New program">
        <ProgramForm
          onSave={createWorkout}
          submitting={savePrograms.isPending}
          submitLabel="Create program"
        />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit program">
        <ProgramForm
          initial={editing ?? undefined}
          onSave={saveEdit}
          submitting={updateProgram.isPending}
          submitLabel="Save changes"
        />
      </Modal>

      <Modal open={dayTarget !== null} onClose={() => setDayTarget(null)} title="Workout day">
        <WorkoutDayForm
          initial={dayTarget?.day}
          onSave={saveDay}
          takenDays={(dayTarget?.program.workoutDays ?? []).map((d) => d.dayOfWeek)}
        />
      </Modal>

      {viewingDay && (
        <Modal
          open={viewingDay !== null}
          onClose={() => setViewingDay(null)}
          title={DAY_NAMES[viewingDay.day.dayOfWeek] ?? viewingDay.day.dayLabel}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-chalk">{viewingDay.day.dayLabel}</p>
              {viewingDay.day.category && (
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
                  {viewingDay.day.category}
                </p>
              )}
            </div>

            {viewingDay.day.isRestDay ? (
              <p className="rounded-[10px] bg-rubber-2 px-3.5 py-3 text-sm text-plate-green">
                Rest day — no exercises scheduled.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(viewingDay.day.exercises ?? []).length === 0 ? (
                  <p className="text-sm text-chalk-faint">No exercises added.</p>
                ) : (
                  (viewingDay.day.exercises ?? []).map((ex) => (
                    <div
                      key={ex.id}
                      className="card-3d flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-chalk">{ex.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-chalk-faint">
                          {ex.unit === "time"
                            ? `${ex.weight > 0 ? `${ex.weight}kg × ` : ""}${ex.duration}s · ${ex.sets} sets`
                            : `${ex.weight}kg × ${ex.reps} reps · ${ex.sets} sets`}
                        </p>
                      </div>
                      {ex.groupLabel && (
                        <span className="font-mono text-[10px] font-bold text-plate-yellow">
                          {ex.groupLabel}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setDayTarget({ program: viewingDay.program, day: viewingDay.day });
              setViewingDay(null);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-red py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-white active:scale-[0.98]"
          >
            Edit workout
          </button>
        </Modal>
      )}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete program">
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
            Delete program
          </FormButton>
        </div>
      </Modal>
    </div>
  );
}
