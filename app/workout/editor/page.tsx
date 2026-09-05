"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys, useApiInvalidations } from "@/lib/api";
import { Program, WorkoutDay } from "@/lib/types";
import { sortWorkoutDays, DAY_NAMES } from "@/lib/todayWorkout";
import { Modal } from "@/components/forms/Modal";
import WorkoutDayForm from "@/components/forms/WorkoutDayForm";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function WorkoutEditorPage() {
  const router = useRouter();
  const { invalidate } = useApiInvalidations();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<WorkoutDay | "new" | null>(null);

  const { data: activeProgram, isLoading } = useQuery<Program>({
    queryKey: queryKeys.activeProgram,
    queryFn: () => api.get<Program>("/api/programs/active"),
  });

  const days = sortWorkoutDays(activeProgram?.workoutDays ?? []);

  const handleSave = async (day: WorkoutDay) => {
    if (!activeProgram) return;
    const cached = queryClient.getQueryData<Program>(queryKeys.activeProgram);
    const current = cached?.workoutDays ? cached : activeProgram;
    const currentDays = current.workoutDays ?? [];
    const exists = currentDays.some((d) => d.dayOfWeek === day.dayOfWeek);
    const updatedDays = exists
      ? currentDays.map((d) => (d.dayOfWeek === day.dayOfWeek ? day : d))
      : [...currentDays, day];
    await api.put(`/api/programs/${activeProgram.id}`, {
      workoutDays: sortWorkoutDays(updatedDays),
    });
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
    setEditing(null);
  };

  const handleDelete = async (dow: number) => {
    if (!activeProgram) return;
    await api.put(`/api/programs/${activeProgram.id}`, {
      workoutDays: days.filter((d) => d.dayOfWeek !== dow),
    });
    await invalidate(queryKeys.programs, queryKeys.activeProgram);
  };

  if (isLoading) {
    return (
      <div className="px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
            Workout builder · {activeProgram?.name ?? "No active program"}
          </p>
          <h1 className="font-display text-[24px] font-bold text-chalk">My week</h1>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={!activeProgram}
          className="flex items-center gap-1.5 rounded-[10px] bg-plate-red px-3.5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          <IconPlus size={15} /> New day
        </button>
      </div>

      {!activeProgram ? (
        <div className="card-3d rounded-[14px] bg-rubber p-5 text-center">
          <p className="mb-3 text-sm text-chalk-faint">
            Activate a program before building your week.
          </p>
          <button
            onClick={() => router.push("/programs")}
            className="rounded-[10px] bg-plate-red px-5 py-3 text-sm font-semibold text-white"
          >
            Go to programs
          </button>
        </div>
      ) : days.length === 0 ? (
        <div className="card-3d rounded-[14px] bg-rubber p-5 text-center">
          <p className="mb-3 text-sm text-chalk-faint">
            No workout days yet. Create your first one.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="rounded-[10px] bg-plate-red px-5 py-3 text-sm font-semibold text-white"
          >
            Create workout
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((day) => (
            <div key={day.dayOfWeek} className="card-3d rounded-[14px] bg-rubber px-4.5 py-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-display text-[17px] font-semibold text-chalk">
                  {day.dayLabel}{" "}
                  <span className="ml-1 text-xs font-sans font-normal text-chalk-dim">·</span>{" "}
                  <span className="text-xs font-sans font-normal text-chalk-faint">
                    {DAY_NAMES[day.dayOfWeek] ?? "Today"}
                  </span>
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(day)}
                    className="rounded-md p-1.5 text-chalk-faint hover:text-chalk"
                    aria-label="Edit day"
                  >
                    <IconPencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(day.dayOfWeek)}
                    className="rounded-md p-1.5 text-chalk-faint hover:text-plate-red"
                    aria-label="Delete day"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
              {day.isRestDay ? (
                <p className="text-xs text-plate-green">Rest day</p>
              ) : (
                <p className="font-mono text-[11px] text-chalk-faint">
                  {day.exercises.length} exercises · {day.category}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 w-full rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk-dim"
      >
        Back to dashboard
      </button>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New workout day" : "Edit workout day"}
      >
        <WorkoutDayForm
          initial={editing && editing !== "new" ? editing : undefined}
          onSave={handleSave}
          takenDays={days.map((d) => d.dayOfWeek)}
        />
      </Modal>
    </div>
  );
}
