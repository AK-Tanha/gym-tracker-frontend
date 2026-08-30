"use client";

import Link from "next/link";
import { IconPlayerPlayFilled, IconArrowRight } from "@tabler/icons-react";
import { todaysWorkout, weekStrip, progressStats, myWorkouts } from "@/lib/mockData";
import { flattenDay } from "@/lib/flattenDay";
import { useRouter } from "next/navigation";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    <div className="rounded-xl bg-rubber p-3.5">
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
  const totalSets = todaysWorkout.exercises.reduce((sum, e) => sum + e.sets, 0);
  const estMinutes = Math.round(totalSets * 3.2);
  const todayName = DAY_NAMES[todaysWorkout.dayOfWeek];
  const queue = flattenDay(todaysWorkout.exercises);
  const completedSets = queue.filter((s) => s.type === "exercise").length;

  return (
    <div className="px-5 pt-2">
      <div className="mb-5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
          {todayName}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-chalk">
              Good morning, AK
            </h1>
            <p className="mt-0.5 text-sm text-chalk-faint">
              {todaysWorkout.dayLabel} · {todaysWorkout.category}
            </p>
          </div>
          <span className="rounded-md bg-plate-blue-bg px-2.5 py-1 text-[11px] font-semibold text-[#7FB2E8]">
            {todaysWorkout.exercises.length} exercises
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Workouts done"
          value={String(progressStats.workoutsDone)}
          icon={<span className="text-[16px]">🔥</span>}
        />
        <StatCard
          label="Current streak"
          value={`${progressStats.streakDays} days`}
          accent
          icon={<span className="text-[16px]">⚡</span>}
        />
        <StatCard
          label="Volume"
          value={`${progressStats.totalVolumeTonnes}t`}
          icon={<span className="text-[16px]">🏋️</span>}
        />
        <StatCard
          label="New PRs"
          value={String(progressStats.newPRs)}
          accent
          icon={<span className="text-[16px]">🪜</span>}
        />
      </div>

      <div className="mb-5 rounded-[14px] bg-rubber p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-chalk-faint">This week</p>
          <span className="font-mono text-[11px] text-[#5DCAA5]">
            {progressStats.weekStreak.filter(Boolean).length}/7 days
          </span>
        </div>
        <div className="flex gap-1.5">
          {progressStats.weekStreak.map((done, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${done ? "bg-plate-green" : "bg-rubber-2"}`}
                style={{ height: 24 }}
              />
              <p className="mt-1 text-center font-mono text-[9px] text-chalk-faint">
                {weekStrip[i].label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-rubber p-5">
        <div className="mb-4">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
            Today&apos;s workout
          </p>
          <h2 className="font-display text-[17px] font-semibold text-chalk">
            {todaysWorkout.dayLabel}
          </h2>
          <p className="mt-0.5 text-xs text-chalk-faint">
            {totalSets} sets · ~{estMinutes} min · {completedSets} steps
          </p>
        </div>
        <div className="mb-4 flex flex-col gap-2">
          {todaysWorkout.exercises.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
            >
              <div>
                <p className="text-sm font-medium text-chalk">{ex.name}</p>
                <p className="mt-0.5 font-mono text-xs text-chalk-faint">
                  {ex.weight}kg × {ex.reps} reps · {ex.sets} sets
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
        <button
          onClick={() => router.push("/workout")}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-red py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white active:scale-[0.98]"
        >
          <IconPlayerPlayFilled size={16} />
          Start workout
        </button>
      </div>

      <div className="mb-5 rounded-[14px] bg-rubber p-4">
        <p className="mb-3 text-xs text-chalk-faint">Bench press · working weight (kg)</p>
        <div className="flex h-[90px] items-end gap-2">
          {progressStats.benchProgression.map((h, i) => (
            <div key={i} className="relative flex-1">
              <div
                className="rounded-t bg-plate-blue"
                style={{ height: `${h}%` }}
              />
              <span className="absolute -bottom-4.5 left-0 right-0 text-center font-mono text-[10px] text-chalk-faint">
                W{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Recent PRs
      </div>
      <div className="flex flex-col gap-2">
        {progressStats.recentPRs.map((pr) => (
          <div
            key={pr.name}
            className="flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
          >
            <div>
              <p className="text-[13px] font-medium text-chalk">{pr.name}</p>
              <p className="mt-0.5 text-[11px] text-chalk-faint">{pr.when}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-bold text-plate-yellow">
                {pr.value}
              </span>
              <IconArrowRight size={14} className="text-chalk-faint" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Programs
      </div>
      <div className="flex flex-col gap-3">
        {progressStats.weekStreak.length > 0 && (
          <div className="rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {myWorkouts[0].name}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {myWorkouts[0].description}
            </p>
            <Link
              href="/programs"
              className="text-[11px] font-semibold text-[#7FB2E8] hover:underline"
            >
              View all programs →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

