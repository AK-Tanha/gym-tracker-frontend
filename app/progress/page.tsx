"use client";

import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

type ProgressStats = {
  workoutsDone: number;
  streakDays: number;
  totalVolumeTonnes: number;
  newPRs: number;
  weekStreak: boolean[];
  benchProgression: number[];
  recentPRs: { name: string; when: string; value: string }[];
};

export default function ProgressPage() {
  const { data, isLoading } = useQuery<ProgressStats>({
    queryKey: queryKeys.progress,
    queryFn: () => api.get<ProgressStats>("/api/progress"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  const s: ProgressStats = {
    workoutsDone: data?.workoutsDone ?? 0,
    streakDays: data?.streakDays ?? 0,
    totalVolumeTonnes: data?.totalVolumeTonnes ?? 0,
    newPRs: data?.newPRs ?? 0,
    weekStreak: data?.weekStreak ?? [],
    benchProgression: data?.benchProgression ?? [],
    recentPRs: data?.recentPRs ?? [],
  };

  return (
    <div className="px-5 pt-2">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
        Last 30 days
      </p>

      <div className="mt-3.5 mb-5.5 grid grid-cols-2 gap-2.5">
        <StatCard label="Workouts done" value={String(s.workoutsDone)} />
        <StatCard label="Current streak" value={`${s.streakDays} days`} accent />
        <StatCard label="Total volume" value={`${s.totalVolumeTonnes}t`} />
        <StatCard label="New PRs" value={String(s.newPRs)} />
      </div>

      <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4">
        <p className="mb-3 text-xs text-chalk-faint">This week</p>
        <div className="flex gap-1.5">
          {s.weekStreak.map((done, i) => (
            <div
              key={i}
              className={`h-6 flex-1 rounded-md ${done ? "bg-plate-green" : "bg-rubber-2"}`}
            />
          ))}
        </div>
      </div>

      <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4 pb-8">
        <p className="mb-3 text-xs text-chalk-faint">
          Bench press · working weight (kg)
        </p>
        <div className="flex h-[90px] items-end gap-2">
          {s.benchProgression.map((h, i) => (
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

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Recent PRs
      </p>
      <div className="flex flex-col gap-2">
        {s.recentPRs.map((pr) => (
          <div
            key={pr.name}
            className="card-3d flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
          >
            <div>
              <p className="text-[13px] font-medium text-chalk">{pr.name}</p>
              <p className="mt-0.5 text-[11px] text-chalk-faint">{pr.when}</p>
            </div>
            <span className="font-mono text-[15px] font-bold text-plate-yellow">
              {pr.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card-3d rounded-xl bg-rubber p-3.5">
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-chalk-faint">
        {label}
      </p>
      <p
        className={`font-mono text-[22px] font-bold ${accent ? "text-[#5DCAA5]" : "text-chalk"}`}
      >
        {value}
      </p>
    </div>
  );
}