"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconChevronDown, IconTrash, IconPencil } from "@tabler/icons-react";
import { api, queryKeys } from "@/lib/api";
import { useUnits } from "@/components/UnitsProvider";
import { Modal } from "@/components/forms/Modal";
import LogSetForm, { LoggedSet } from "@/components/forms/LogSetForm";

type ProgressStats = {
  workoutsDone: number;
  streakDays: number;
  weekStreak: boolean[];
  chartExercise: string;
  chartBars: { weight: number; height: number }[];
  recentPRs: {
    name: string;
    when: string;
    valueKg: number;
    previousKg: number;
    improvementKg: number;
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
  const [editingEntry, setEditingEntry] = useState<LoggedSetEntry | null>(null);
  const [deleteSet, setDeleteSet] = useState<LoggedSetEntry | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [prExercise, setPrExercise] = useState<string>("");
  const { unit, display } = useUnits();
  const queryClient = useQueryClient();

  const refreshLogs = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.loggedSets });
    await queryClient.invalidateQueries({ queryKey: queryKeys.progress });
  };

  const saveEditedSet = async (set: LoggedSet) => {
    if (!editingEntry) return;
    setMutating(true);
    try {
      await api.put(`/api/logged-sets/${editingEntry.id}`, {
        weight: set.weight,
        reps: set.reps,
        duration: set.duration,
        rpe: set.rpe,
        notes: set.notes,
        unit: set.unit,
      });
      setEditingEntry(null);
      await refreshLogs();
    } finally {
      setMutating(false);
    }
  };

  const confirmDeleteSet = async () => {
    if (!deleteSet) return;
    setMutating(true);
    try {
      await api.delete(`/api/logged-sets/${deleteSet.id}`);
      setDeleteSet(null);
      await refreshLogs();
    } finally {
      setMutating(false);
    }
  };

  const confirmDeleteDate = async () => {
    if (!deletingDate) return;
    setMutating(true);
    try {
      await api.delete(`/api/logged-sets?date=${encodeURIComponent(deletingDate)}`);
      setDeletingDate(null);
      if (expandedDate === deletingDate) setExpandedDate(null);
      await refreshLogs();
    } finally {
      setMutating(false);
    }
  };

  const byDate = useMemo(() => {
    const map = new Map<string, LoggedSetEntry[]>();
    for (const e of loggedData?.entries ?? []) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [loggedData]);

  const exercisePRs = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        maxWeight: number;
        maxWeightDate: string;
        bestSet: LoggedSetEntry | null;
        byDate: Map<string, number>;
      }
    >();
    for (const e of loggedData?.entries ?? []) {
      let ex = map.get(e.exerciseName);
      if (!ex) {
        ex = {
          name: e.exerciseName,
          maxWeight: 0,
          maxWeightDate: "",
          bestSet: null,
          byDate: new Map(),
        };
        map.set(e.exerciseName, ex);
      }
      if (e.weight > ex.maxWeight) {
        ex.maxWeight = e.weight;
        ex.maxWeightDate = e.date;
        ex.bestSet = e;
      }
      const prev = ex.byDate.get(e.date) ?? 0;
      if (e.weight > prev) ex.byDate.set(e.date, e.weight);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [loggedData]);

  const selectedPR = useMemo(() => {
    if (exercisePRs.length === 0) return null;
    return exercisePRs.find((o) => o.name === prExercise) ?? exercisePRs[0];
  }, [exercisePRs, prExercise]);

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
                {display(change)} {unit}
              </span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">Current</p>
                <p className="font-mono text-[15px] font-bold text-chalk">{display(current)} {unit}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">Low</p>
                <p className="font-mono text-[15px] font-bold text-[#5DCAA5]">{display(min)} {unit}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-chalk-faint">High</p>
                <p className="font-mono text-[15px] font-bold text-plate-yellow">
                  {display(max)} {unit}
                </p>
              </div>
            </div>
            <div className="mt-1">
              <WeightTrendChart
                points={bwEntries.map((e) => ({ date: e.date, value: e.weight }))}
                fmt={(k) => display(k)}
                showTrend
                ariaLabel="Body weight trend"
              />
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
        const last = s.chartBars[s.chartBars.length - 1];
        const prev =
          s.chartBars.length > 1 ? s.chartBars[s.chartBars.length - 2] : null;
        const delta = prev ? last.weight - prev.weight : null;
        const prevTop = prev ? 100 - prev.height : null;
        const prevWeight = prev?.weight ?? 0;
        return (
          <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4 pb-10">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-chalk-faint">
                {s.chartExercise} · weekly max
              </p>
              <span className="font-mono text-[11px] font-bold text-plate-yellow">
                {display(best)}{unit} best
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-[10px] bg-rubber-2 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-chalk-faint">
                  Last week
                </p>
                <p className="font-mono text-[16px] font-bold text-chalk-dim">
                  {prev ? `${display(prev.weight)}${unit}` : "—"}
                </p>
              </div>
              <div className="rounded-[10px] border border-plate-green/40 bg-rubber-2 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-chalk-faint">
                  This week
                </p>
                <p className="font-mono text-[16px] font-bold text-[#5DCAA5]">
                  {display(last.weight)}{unit}
                </p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-1.5">
              {delta === null ? (
                <span className="rounded-md bg-rubber-2 px-2 py-0.5 font-mono text-[11px] font-bold text-chalk-faint">
                  First week logged
                </span>
              ) : (
                <>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                      delta > 0
                        ? "bg-plate-green/15 text-[#5DCAA5]"
                        : delta < 0
                          ? "bg-plate-red/15 text-[#E8B923]"
                          : "bg-rubber-2 text-chalk-faint"
                    }`}
                  >
                    {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}{" "}
                    {delta > 0 ? "+" : ""}
                    {display(Math.abs(delta))}{unit}
                  </span>
                  <span className="text-[11px] text-chalk-faint">
                    {delta >= 0 ? "vs last week" : "under last week"}
                  </span>
                </>
              )}
            </div>

            <div className="relative mt-5 flex h-[90px] items-end gap-2">
              {prevTop !== null && (
                <>
                  <div
                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-plate-yellow/60"
                    style={{ top: `${prevTop}%` }}
                  />
                  <span
                    className="pointer-events-none absolute right-0 font-mono text-[9px] text-plate-yellow/80"
                    style={{
                      top: `${prevTop}%`,
                      transform: "translateY(-130%)",
                    }}
                  >
                    last week {display(prevWeight)}{unit}
                  </span>
                </>
              )}
              {s.chartBars.map((bar, i) => {
                const isCurrent = i === s.chartBars.length - 1;
                return (
                  <div key={i} className="relative flex-1">
                    <div
                      className={`rounded-t ${isCurrent ? "bg-plate-green" : "bg-plate-blue"}`}
                      style={{ height: `${bar.height}%` }}
                    />
                    <span className="absolute -top-4 left-0 right-0 text-center font-mono text-[9px] text-chalk-dim">
                      {bar.weight > 0 ? display(bar.weight) : ""}
                    </span>
                    <span className="absolute -bottom-4.5 left-0 right-0 text-center font-mono text-[10px] text-chalk-faint">
                      {isCurrent ? "Now" : `W${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Personal bests
      </p>
      {exercisePRs.length === 0 ? (
        <div className="card-3d rounded-[14px] bg-rubber px-4 py-5 text-center">
          <p className="text-xs text-chalk-faint">
            No bests yet. Log a workout and they&apos;ll show up here.
          </p>
        </div>
      ) : (
        selectedPR && (() => {
          const chart = [...selectedPR.byDate.entries()]
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
          const lastVal = chart[chart.length - 1];
          const prevVal =
            chart.length > 1
              ? Math.max(...chart.slice(0, -1).map((p) => p.value))
              : null;
          const delta = prevVal !== null ? lastVal.value - prevVal : null;
          const best = selectedPR.bestSet;
          const isTime = best?.unit === "time" && selectedPR.maxWeight === 0;
          return (
            <div className="card-3d mb-2 rounded-[14px] bg-rubber p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[13px] font-semibold text-chalk">
                  {selectedPR.name}
                </p>
                <select
                  value={selectedPR.name}
                  onChange={(e) => setPrExercise(e.target.value)}
                  aria-label="Pick an exercise"
                  className="w-auto shrink-0 rounded-[10px] bg-rubber-2 px-2.5 py-2 text-[11px] font-semibold text-chalk outline-none focus:ring-2 focus:ring-plate-blue"
                >
                  {exercisePRs.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-chalk-faint">
                    Best {isTime ? "hold" : "lift"}
                  </p>
                  {isTime ? (
                    <p className="font-mono text-[20px] font-bold text-chalk">
                      {best?.duration}
                      <span className="text-sm text-chalk-faint">s hold</span>
                    </p>
                  ) : (
                    <p className="font-mono text-[20px] font-bold text-chalk">
                      {display(selectedPR.maxWeight)}
                      <span className="text-sm text-chalk-faint">{unit} × {best?.reps ?? 0} reps</span>
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
                    {selectedPR.maxWeightDate
                      ? formatDate(selectedPR.maxWeightDate)
                      : ""}
                  </p>
                </div>
                {delta === null ? (
                  <span className="rounded-md bg-rubber-2 px-2 py-0.5 font-mono text-[10px] font-bold text-chalk-faint">
                    First logged
                  </span>
                ) : (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                      delta > 0
                        ? "bg-plate-green/15 text-[#5DCAA5]"
                        : delta < 0
                          ? "bg-plate-red/15 text-[#E8B923]"
                          : "bg-rubber-2 text-chalk-faint"
                    }`}
                  >
                    {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {delta > 0 ? "+" : ""}
                    {display(Math.abs(delta))}{unit}
                  </span>
                )}
              </div>

              <div className="mt-1">
                <WeightTrendChart
                  points={chart}
                  fmt={(k) => display(k)}
                  suffix={unit}
                  showTrend
                  ariaLabel={`${selectedPR.name} best per workout`}
                />
              </div>
            </div>
          );
        })()
      )}

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedDate(expanded ? null : date)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
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
                      className={`shrink-0 text-chalk-faint transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setDeletingDate(date)}
                    disabled={mutating}
                    aria-label={`Delete ${formatDate(date)} workout`}
                    className="shrink-0 rounded-md p-1.5 text-chalk-faint transition hover:text-plate-red disabled:opacity-40"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-rubber-2 pt-3">
                    {[...byExercise.entries()].map(([name, sets]) => (
                      <div key={name}>
                        <p className="mb-1.5 text-[13px] font-semibold text-chalk">{name}</p>
                        <div className="flex flex-col gap-1">
                          {sets.map((set, i) => (
                            <div
                              key={set.id ?? i}
                              className="flex items-center gap-2 rounded-[8px] bg-rubber-2 px-3 py-1.5"
                            >
                              <span className="w-11 shrink-0 font-mono text-[11px] text-chalk-faint">
                                Set {set.setNumber}
                              </span>
                              <span className="min-w-0 flex-1 text-right font-mono text-[12px] font-bold text-chalk">
                                {set.unit === "time"
                                  ? set.weight > 0
                                    ? `${display(set.weight)}${unit} × ${set.duration}s`
                                    : `${set.duration}s`
                                  : `${display(set.weight)}${unit} × ${set.reps} reps`}
                              </span>
                              <span className="w-9 shrink-0 text-right font-mono text-[10px] text-chalk-faint">
                                {set.rpe ? `RPE ${set.rpe}` : ""}
                              </span>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                  onClick={() => setEditingEntry(set)}
                                  disabled={mutating}
                                  aria-label={`Edit ${set.exerciseName} set ${set.setNumber}`}
                                  className="rounded-md p-1 text-chalk-faint transition hover:text-chalk disabled:opacity-40"
                                >
                                  <IconPencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDeleteSet(set)}
                                  disabled={mutating}
                                  aria-label={`Delete ${set.exerciseName} set ${set.setNumber}`}
                                  className="rounded-md p-1 text-chalk-faint transition hover:text-plate-red disabled:opacity-40"
                                >
                                  <IconTrash size={13} />
                                </button>
                              </div>
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

      <Modal
        open={!!editingEntry}
        onClose={() => !mutating && setEditingEntry(null)}
        title="Edit set"
      >
        {editingEntry && (
          <div className="mb-3 rounded-[10px] bg-rubber-2 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-chalk">{editingEntry.exerciseName}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
              Set {editingEntry.setNumber} · {formatDate(editingEntry.date)}
            </p>
          </div>
        )}
        {editingEntry && (
          <LogSetForm
            key={editingEntry.id}
            unit={editingEntry.unit}
            suggestedWeight={editingEntry.weight}
            suggestedReps={editingEntry.reps}
            suggestedDuration={editingEntry.duration}
            submitting={mutating}
            onDone={saveEditedSet}
          />
        )}
      </Modal>

      <Modal
        open={!!deleteSet}
        onClose={() => !mutating && setDeleteSet(null)}
        title="Delete set?"
      >
        {deleteSet && (
          <p className="mb-5 text-sm text-chalk-faint">
            Delete {deleteSet.exerciseName}, set {deleteSet.setNumber} from{" "}
            {formatDate(deleteSet.date)}? This can&apos;t be undone.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteSet(null)}
            disabled={mutating}
            className="flex-1 rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteSet}
            disabled={mutating}
            className="flex-1 rounded-[10px] bg-plate-red py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {mutating ? "Deleting…" : "Delete set"}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!deletingDate}
        onClose={() => !mutating && setDeletingDate(null)}
        title="Delete workout?"
      >
        {deletingDate && (
          <p className="mb-5 text-sm text-chalk-faint">
            Delete all sets logged on {formatDate(deletingDate)}? This can&apos;t be
            undone.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setDeletingDate(null)}
            disabled={mutating}
            className="flex-1 rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteDate}
            disabled={mutating}
            className="flex-1 rounded-[10px] bg-plate-red py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {mutating ? "Deleting…" : "Delete workout"}
          </button>
        </div>
      </Modal>
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

type TrendPoint = { date: string; value: number };

function WeightTrendChart({
  points,
  fmt,
  suffix = "",
  ariaLabel,
  showTrend = false,
}: {
  points: TrendPoint[];
  fmt: (n: number) => string;
  suffix?: string;
  ariaLabel: string;
  showTrend?: boolean;
}) {
  if (points.length === 0) return null;
  const W = 300;
  const H = 132;
  const padL = 32;
  const padR = 10;
  const padT = 14;
  const padB = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const top = max + span * 0.2;
  const bottom = min - span * 0.2;
  const n = points.length;
  const yFor = (k: number) => padT + ((top - k) / (top - bottom)) * plotH;
  const xFor = (i: number) =>
    padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const pts = points.map((p, i) => ({ x: xFor(i), y: yFor(p.value), p }));
  const lastIdx = n - 1;
  const last = pts[lastIdx];
  const gid = `trend-${ariaLabel.replace(/[^a-z0-9]+/gi, "-")}-${n}`;

  let trend: [number, number] | null = null;
  if (showTrend && n >= 2) {
    const sX = values.reduce((s, _v, i) => s + i, 0);
    const sY = values.reduce((s, v) => s + v, 0);
    const sXY = values.reduce((s, v, i) => s + i * v, 0);
    const sXX = values.reduce((s, _v, i) => s + i * i, 0);
    const denom = n * sXX - sX * sX;
    if (denom !== 0) {
      const slope = (n * sXY - sX * sY) / denom;
      const intercept = (sY - slope * sX) / n;
      trend = [intercept, intercept + slope * (n - 1)];
    }
  }

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${last.x.toFixed(1)},${padT + plotH} L${pts[0].x.toFixed(1)},${padT + plotH} Z`;
  const trendPath = trend
    ? `M${padL},${yFor(trend[0]).toFixed(1)} L${(padL + plotW).toFixed(1)},${yFor(trend[1]).toFixed(1)}`
    : null;
  const fmtDate = (d: string) => d.slice(5).replace("-", "/");

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FB2E8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7FB2E8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[min, (min + max) / 2, max].map((k, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={padL + plotW}
            y1={yFor(k)}
            y2={yFor(k)}
            stroke="rgba(110,108,102,0.22)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text
            x={padL - 4}
            y={yFor(k) + 3}
            textAnchor="end"
            fontSize={8.5}
            className="fill-chalk-faint"
            fontFamily="JetBrains Mono, monospace"
          >
            {fmt(k)}
          </text>
        </g>
      ))}

      {trendPath && (
        <path
          d={trendPath}
          stroke="rgba(232,185,35,0.55)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
        />
      )}

      {n > 1 && <path d={areaPath} fill={`url(#${gid})`} />}
      <path
        d={linePath}
        fill="none"
        stroke="#7FB2E8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p, i) =>
        i === lastIdx ? null : (
          <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="#7FB2E8" />
        )
      )}

      {last && (
        <g>
          <circle
            cx={last.x}
            cy={last.y}
            r={5}
            fill="#5DCAA5"
            stroke="#242528"
            strokeWidth={2}
          />
          <text
            x={last.x}
            y={last.y - 9}
            textAnchor={last.x > padL + plotW - 26 ? "end" : "middle"}
            fontSize={9}
            fontWeight={700}
            className="fill-chalk"
            fontFamily="JetBrains Mono, monospace"
          >
            {fmt(last.p.value)}
            {suffix}
          </text>
        </g>
      )}

      <text
        x={padL}
        y={H - 6}
        fontSize={8.5}
        className="fill-chalk-faint"
        fontFamily="JetBrains Mono, monospace"
      >
        {fmtDate(points[0].date)}
      </text>
      <text
        x={padL + plotW}
        y={H - 6}
        textAnchor="end"
        fontSize={8.5}
        className="fill-chalk-faint"
        fontFamily="JetBrains Mono, monospace"
      >
        {fmtDate(points[points.length - 1].date)}
      </text>
    </svg>
  );
}