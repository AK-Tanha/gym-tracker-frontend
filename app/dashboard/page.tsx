"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconPlayerPlayFilled,
  IconPlus,
  IconCircleCheck,
  IconRotateClockwise2,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { WorkoutDay, Program } from "@/lib/types";
import { getTodaysWorkout, todayName } from "@/lib/todayWorkout";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/forms/Modal";

type LoggedEntry = {
  exerciseName: string;
  date: string;
};

const WEEK_LABELS = ["S", "S", "M", "T", "W", "T", "F"];

type ProgressStats = {
  workoutsDone: number;
  streakDays: number;
  weekStreak: boolean[];
  chartExercise: string;
  chartBars: { weight: number; height: number }[];
  recentPRs: {
    name: string;
    when: string;
    value: string;
    previous: string;
    improvement: string;
  }[];
};

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card-3d rounded-xl bg-rubber p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon && <span className="text-chalk-dim">{icon}</span>}
        <p className="text-[11px] uppercase tracking-wide text-chalk-faint">{label}</p>
      </div>
      <p className={`font-mono text-[22px] font-bold ${accent ? "text-[#5DCAA5]" : "text-chalk"}`}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [confirmRedo, setConfirmRedo] = useState(false);
  const authName = session?.user?.name ?? "Athlete";
  const isAdmin = session?.user?.role === "superadmin";
  const { data: activeProgram, isLoading: programLoading } = useQuery<Program>({
    queryKey: queryKeys.activeProgram,
    queryFn: () => api.get<Program>("/api/programs/active"),
  });
  const todaysWorkout = getTodaysWorkout(activeProgram);
  const { data: progressStats, isLoading: statsLoading } = useQuery<ProgressStats>({
    queryKey: queryKeys.progress,
    queryFn: () => api.get<ProgressStats>("/api/progress"),
  });
  const { data: loggedData, isLoading: loggedLoading } = useQuery<{ entries: LoggedEntry[] }>({
    queryKey: queryKeys.loggedSets,
    queryFn: () => api.get("/api/logged-sets"),
  });
  const { data: programsData, isLoading: programsLoading } = useQuery<{
    myWorkouts: Program[];
  }>({
    queryKey: queryKeys.programs,
    queryFn: () => api.get("/api/programs"),
  });

  const todays = todaysWorkout ?? ({} as WorkoutDay);
  const stats = progressStats ?? ({} as ProgressStats);
  const myWorkouts = programsData?.myWorkouts ?? [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysLoggedSets = (loggedData?.entries ?? []).filter((e) => e.date === todayStr);
  const plannedNames = (todays.exercises ?? []).map((ex) => ex.name);
  const todayWorkoutDone =
    plannedNames.length > 0 &&
    plannedNames.every((name) => todaysLoggedSets.some((s) => s.exerciseName === name));

  const totalSets = todays.exercises?.reduce((sum, e) => sum + e.sets, 0) ?? 0;
  const estMinutes = Math.round(totalSets * 3.2);
  const weekdayName = todayName(todays.dayOfWeek);

  const handleRedoWorkout = async () => {
    setConfirmRedo(false);
    try {
      await api.delete("/api/logged-sets");
      await queryClient.invalidateQueries({ queryKey: queryKeys.loggedSets });
      await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    } catch {
      // ignore reset failure and proceed
    }
    router.push("/workout");
  };

  if (programLoading || statsLoading || programsLoading || loggedLoading) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="mb-5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
          {weekdayName}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-chalk">
              {(() => {
                const h = new Date().getHours();
                const greeting =
                  h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
                return `${greeting}, ${authName}`;
              })()}
            </h1>
            <p className="mt-0.5 text-sm text-chalk-faint">
              {isAdmin && (
                <span className="mr-1.5 inline-block rounded bg-plate-red/20 px-1.5 py-0.5 align-middle text-[10px] font-bold text-plate-red">
                  SUPERADMIN
                </span>
              )}
              {todaysWorkout
                ? `${todays.dayLabel}${todays.category ? ` · ${todays.category}` : ""}`
                : `Rest day — no workout scheduled for ${weekdayName}`}
            </p>
          </div>
          <span className="rounded-md bg-plate-blue-bg px-2.5 py-1 text-[11px] font-semibold text-[#7FB2E8]">
            {todaysWorkout ? `${todays.exercises?.length ?? 0} exercises` : "Rest"}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Workouts done"
          value={String(stats.workoutsDone ?? 0)}
          icon={<span className="text-[16px]">🔥</span>}
        />
        <StatCard
          label="Current streak"
          value={`${stats.streakDays ?? 0} days`}
          accent
          icon={<span className="text-[16px]">⚡</span>}
        />
      </div>

      <div className="card-3d mb-5 rounded-[14px] bg-rubber p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-chalk-faint">This week</p>
          <span className="font-mono text-[11px] text-[#5DCAA5]">
            {(stats.weekStreak ?? []).filter(Boolean).length}/7 days
          </span>
        </div>
        <div className="flex gap-1.5">
          {(stats.weekStreak ?? []).map((done, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${done ? "bg-plate-green" : "bg-rubber-2"}`}
                style={{ height: 24 }}
              />
              <p className="mt-1 text-center font-mono text-[9px] text-chalk-faint">
                {WEEK_LABELS[i] ?? ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-3d mb-5 rounded-2xl bg-rubber p-5">
        <div className="mb-4">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
            Today&apos;s workout
          </p>
          <h2 className="font-display text-[17px] font-semibold text-chalk">
            {todaysWorkout ? todays.dayLabel : "Rest day"}
          </h2>
          {todaysWorkout ? (
            <p className="mt-0.5 text-xs text-chalk-faint">
              {totalSets} sets · ~{estMinutes} min · {todaysLoggedSets.length}/{totalSets} sets logged
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-chalk-faint">
              No workout scheduled for {weekdayName}.
            </p>
          )}
        </div>
        {todaysWorkout && (
          <>
            <div className="mb-4 flex flex-col gap-2">
              {(todays.exercises ?? []).map((ex) => (
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
              ))}
            </div>
            {todayWorkoutDone ? (
              <>
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-green py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white opacity-70"
                >
                  <IconCircleCheck size={16} />
                  Completed
                </button>
                <button
                  onClick={() => setConfirmRedo(true)}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk-dim"
                >
                  <IconRotateClockwise2 size={15} />
                  Redo workout
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/workout")}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-red py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white active:scale-[0.98]"
              >
                <IconPlayerPlayFilled size={16} />
                Start workout
              </button>
            )}
          </>
        )}
        <button
          onClick={() => router.push("/workout/editor")}
          className={
            todaysWorkout
              ? "mt-2.5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk-dim"
              : "flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-red py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white active:scale-[0.98]"
          }
        >
          <IconPlus size={15} />
          Build my week
        </button>
      </div>

      <div className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Programs
      </div>
      <div className="flex flex-col gap-3">
        {activeProgram && (
          <div className="card-3d rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {activeProgram.name}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {activeProgram.description}
            </p>
            <Link
              href="/programs"
              className="text-[11px] font-semibold text-[#7FB2E8] hover:underline"
            >
              View all programs →
            </Link>
          </div>
        )}
        {!activeProgram && myWorkouts.length === 0 && (
          <Link
            href="/programs"
            className="card-3d rounded-[14px] bg-rubber px-4.5 py-4 text-xs text-chalk-faint"
          >
            Create your first program →
          </Link>
        )}
      </div>

      <Modal
        open={confirmRedo}
        onClose={() => setConfirmRedo(false)}
        title="Redo today's workout?"
      >
        <p className="mb-5 text-sm leading-relaxed text-chalk-faint">
          This will clear today&apos;s logged sets and start a fresh workout. Your previous
          progress for today will be removed.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={() => setConfirmRedo(false)}
            className="flex-1 rounded-[10px] border border-rubber-2 py-3.5 text-sm font-semibold text-chalk-dim"
          >
            Cancel
          </button>
          <button
            onClick={handleRedoWorkout}
            className="flex-1 rounded-[10px] bg-plate-red py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-white"
          >
            Yes, redo
          </button>
        </div>
      </Modal>
    </div>
  );
}