"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown } from "@tabler/icons-react";
import { api, queryKeys } from "@/lib/api";

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

type BodyWeightEntry = { date: string; weight: number };
type BodyWeightDoc = { _id?: string; entries: BodyWeightEntry[] };

type LoggedSetEntry = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  unit: "reps" | "time";
  weight: number;
  reps: number;
  duration: number;
  rpe: number | null;
  notes: string;
  date: string;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function ProgressPage() {
  const { data, isLoading } = useQuery<ProgressStats>({
    queryKey: queryKeys.progress,
    queryFn: () => api.get<ProgressStats>("/api/progress"),
  });
  const { data: loggedData, isLoading: loggedLoading } = useQuery<{ entries: LoggedSetEntry[] }>({
    queryKey: queryKeys.loggedSets,
    queryFn: () => api.get("/api/logged-sets"),
  });
  const { data: bwData } = useQuery<BodyWeightDoc>({
    queryKey: queryKeys.bodyweight,
    queryFn: () => api.get<BodyWeightDoc>("/api/bodyweight"),
  });
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, LoggedSetEntry[]>();
    for (const e of loggedData?.entries ?? []) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [loggedData]);

  if (isLoading || !data || loggedLoading) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  const s: ProgressStats = {
    workoutsDone: data?.workoutsDone ?? 0,
    streakDays: data?.streakDays ?? 0,
    weekStreak: data?.weekStreak ?? [],
    chartExercise: data?.chartExercise ?? "",
    chartBars: data?.chartBars ?? [],
    recentPRs: data?.recentPRs ?? [],
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="px-5 pt-2">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
        Last 30 days
      </p>

      <div className="mt-3.5 mb-5.5 grid grid-cols-2 gap-2.5">
        <StatCard label="Workouts done" value={String(s.workoutsDone)} />
        <StatCard label="Current streak" value={`${s.streakDays} days`} accent />
      </div>

      {(() => {
        const bwEntries = bwData?.entries ?? [];
        if (bwEntries.length === 0) return null;
        const weights = bwEntries.map((e) => e.weight);
        const current = weights[weights.length - 1];
        const first = weights[0];
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const change = current - first;
        const recent = bwEntries.slice(-8);
        const bwMax = Math.max(...recent.map((e) => e.weight));
        const bwMin = Math.min(...recent.map((e) => e.weight));
        const range = bwMax - bwMin || 1;

        return (
          <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-chalk-faint">Body weight</p>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                  change > 0
                    ? "bg-plate-red/15 text-[#E8B923]"
                    : change < 0
                      ? "bg-plate-green/15 text-[#5DCAA5]"
                      : "bg-rubber-2 text-chalk-faint"
                }`}
              >
                {change > 0 ? "▲" : change < 0 ? "▼" : "—"} {change > 0 ? "+" : ""}
                {change.toFixed(1)}
              </span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">Current</p>
                <p className="font-mono text-[15px] font-bold text-chalk">{current}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">Low</p>
                <p className="font-mono text-[15px] font-bold text-[#5DCAA5]">{min}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">High</p>
                <p className="font-mono text-[15px] font-bold text-plate-yellow">{max}</p>
              </div>
            </div>
            <div className="mt-2 flex h-[60px] items-end gap-1.5">
              {recent.map((entry, i) => {
                const pct = ((entry.weight - bwMin) / range) * 100;
                return (
                  <div key={entry.date} className="relative flex-1">
                    <div
                      className="rounded-t bg-plate-blue"
                      style={{ height: `${Math.max(pct, 8)}%` }}
                    />
                    <span className="absolute -bottom-4 left-0 right-0 text-center font-mono text-[9px] text-chalk-faint">
                      {entry.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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

      {s.chartExercise && s.chartBars.length > 0 && (() => {
        const weights = s.chartBars.map((b) => b.weight);
        const best = Math.max(...weights);
        const change = weights[weights.length - 1] - weights[0];
        return (
          <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4 pb-10">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-chalk-faint">
                {s.chartExercise} · weekly max
              </p>
              <span className="font-mono text-[11px] font-bold text-plate-yellow">
                {best}kg best
              </span>
            </div>
            <div className="mb-3 flex items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                  change > 0
                    ? "bg-plate-green/15 text-[#5DCAA5]"
                    : change < 0
                      ? "bg-plate-red/15 text-[#E8B923]"
                      : "bg-rubber-2 text-chalk-faint"
                }`}
              >
                {change > 0 ? "▲" : change < 0 ? "▼" : "—"} {change > 0 ? "+" : ""}
                {change}kg
              </span>
              <span className="text-[11px] text-chalk-faint">
                from week 1 to week {s.chartBars.length}
              </span>
            </div>
            <div className="mt-4 flex h-[90px] items-end gap-2">
              {s.chartBars.map((bar, i) => (
                <div key={i} className="relative flex-1">
                  <div
                    className={`rounded-t ${bar.weight === best ? "bg-plate-green" : "bg-plate-blue"}`}
                    style={{ height: `${bar.height}%` }}
                  />
                  <span className="absolute -top-4 left-0 right-0 text-center font-mono text-[9px] text-chalk-dim">
                    {bar.weight > 0 ? bar.weight : ""}
                  </span>
                  <span className="absolute -bottom-4.5 left-0 right-0 text-center font-mono text-[10px] text-chalk-faint">
                    W{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        New personal bests
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
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="font-mono text-[15px] font-bold text-plate-yellow">
                  {pr.value}
                </p>
                <p className="font-mono text-[10px] text-chalk-faint">
                  prev {pr.previous}
                </p>
              </div>
              <span className="rounded-md bg-plate-green/15 px-2 py-1 font-mono text-[10px] font-bold text-[#5DCAA5]">
                {pr.improvement}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2.5 mt-5 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-chalk-dim">Workout history</p>
        <span className="font-mono text-[11px] text-chalk-faint">{byDate.length} workouts</span>
      </div>
      {byDate.length === 0 ? (
        <div className="card-3d rounded-[14px] bg-rubber px-4 py-5 text-center">
          <p className="text-xs text-chalk-faint">
            No workouts logged yet. Start your first session and it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {byDate.map(([date, entries]) => {
            const expanded = expandedDate === date;
            const totalVolume = entries.reduce(
              (sum, e) => sum + (e.weight * e.reps) / 1000,
              0
            );
            const byExercise = new Map<string, LoggedSetEntry[]>();
            for (const e of entries) {
              const arr = byExercise.get(e.exerciseName) ?? [];
              arr.push(e);
              byExercise.set(e.exerciseName, arr);
            }
            return (
              <div key={date} className="card-3d rounded-[14px] bg-rubber px-4 py-3.5">
                <button
                  onClick={() => setExpandedDate(expanded ? null : date)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-chalk">
                      {formatDate(date)}
                      {date === todayStr && (
                        <span className="rounded-full bg-plate-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Today
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-chalk-faint">
                      {byExercise.size} exercises · {entries.length} sets
                      {totalVolume > 0 ? ` · ${Math.round(totalVolume * 100) / 100}t` : ""}
                    </p>
                  </div>
                  <IconChevronDown
                    size={18}
                    className={`text-chalk-faint transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-rubber-2 pt-3">
                    {[...byExercise.entries()].map(([name, sets]) => (
                      <div key={name}>
                        <p className="mb-1.5 text-[13px] font-semibold text-chalk">{name}</p>
                        <div className="flex flex-col gap-1">
                          {sets.map((set, i) => (
                            <div
                              key={set.id ?? i}
                              className="flex items-center justify-between rounded-[8px] bg-rubber-2 px-3 py-1.5"
                            >
                              <span className="font-mono text-[11px] text-chalk-faint">
                                Set {set.setNumber}
                              </span>
                              <span className="font-mono text-[12px] font-bold text-chalk">
                                {set.unit === "time"
                                  ? set.weight > 0
                                    ? `${set.weight}kg × ${set.duration}s`
                                    : `${set.duration}s`
                                  : `${set.weight}kg × ${set.reps} reps`}
                              </span>
                              <span className="font-mono text-[10px] text-chalk-faint">
                                {set.rpe ? `RPE ${set.rpe}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                        {sets.some((set) => set.notes) && (
                          <p className="mt-1.5 text-[11px] italic text-chalk-faint">
                            {sets
                              .filter((set) => set.notes)
                              .map((set) => set.notes)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[dt.getUTCDay()] ?? ""}, ${MONTHS[m - 1] ?? ""} ${d}`;
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