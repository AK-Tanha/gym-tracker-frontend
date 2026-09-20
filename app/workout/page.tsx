"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconX,
  IconList,
  IconArrowUp,
  IconArrowDown,
  IconAlertTriangle,
  IconReorder,
} from "@tabler/icons-react";
import { api, queryKeys } from "@/lib/api";
import { Program, ExecutionStep, PlannedExercise } from "@/lib/types";
import { flattenDay } from "@/lib/flattenDay";
import { getTodaysWorkout } from "@/lib/todayWorkout";
import LogSetForm, { LoggedSet } from "@/components/forms/LogSetForm";
import { Modal } from "@/components/forms/Modal";
import {
  saveWorkoutState,
  loadWorkoutState,
  clearWorkoutState,
} from "@/lib/workoutPersist";
import { useUnits } from "@/components/UnitsProvider";

export default function WorkoutRunnerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeProgram, isLoading } = useQuery<Program>({
    queryKey: queryKeys.activeProgram,
    queryFn: () => api.get<Program>("/api/programs/active"),
  });

  const todaysWorkout = getTodaysWorkout(activeProgram);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showReorder, setShowReorder] = useState(false);

  const [exerciseOrder, setExerciseOrder] = useState<PlannedExercise[]>(() => {
    const saved = loadWorkoutState();
    if (saved) return saved.exerciseOrder;
    return todaysWorkout?.exercises ?? [];
  });
  const [queue, setQueue] = useState<ExecutionStep[]>(() => {
    const saved = loadWorkoutState();
    if (saved) return saved.queue;
    return todaysWorkout ? flattenDay(todaysWorkout.exercises) : [];
  });
  const [index, setIndex] = useState(() => {
    const saved = loadWorkoutState();
    return saved?.index ?? 0;
  });
  const [logging, setLogging] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const loggedSetsRef = useRef<LoggedSet[]>([]);
  const syncedIdsRef = useRef<Set<string>>(new Set());
  const [pendingSets, setPendingSets] = useState<ExecutionStep[]>(() => {
    const saved = loadWorkoutState();
    return saved?.pendingSets ?? [];
  });
  const [completedSets, setCompletedSets] = useState<Set<string>>(() => {
    const saved = loadWorkoutState();
    return new Set(saved?.completedSets ?? []);
  });

  useEffect(() => {
    const saved = loadWorkoutState();
    if (saved?.loggedSets) {
      loggedSetsRef.current = saved.loggedSets;
    }
    if (saved?.syncedIds) {
      syncedIdsRef.current = new Set(saved.syncedIds);
    }
  }, []);
  const stepKey = useCallback(
    (s: ExecutionStep | undefined) =>
      s?.type === "exercise" ? `${s.exerciseId}:${s.setNumber}` : "",
    []
  );

  const rebuildQueue = useCallback(
    (newOrder: PlannedExercise[], keepIndexFrom?: ExecutionStep) => {
      const newQueue = flattenDay(newOrder);
      setQueue(newQueue);
      if (keepIndexFrom?.type === "exercise") {
        const found = newQueue.findIndex(
          (s) =>
            s.type === "exercise" &&
            s.exerciseId === keepIndexFrom.exerciseId &&
            s.setNumber === keepIndexFrom.setNumber
        );
        if (found >= 0) setIndex(found);
      }
    },
    []
  );

  const groupSpan = useCallback((pos: number) => {
    const ex = exerciseOrder[pos];
    if (!ex?.groupId) return { start: pos, end: pos };
    let start = pos;
    let end = pos;
    while (start > 0 && exerciseOrder[start - 1].groupId === ex.groupId) start--;
    while (
      end < exerciseOrder.length - 1 &&
      exerciseOrder[end + 1].groupId === ex.groupId
    )
      end++;
    return { start, end };
  }, [exerciseOrder]);

  const reorderExercise = useCallback(
    (fromPos: number, toPos: number) => {
      const from = groupSpan(fromPos);
      const dir = toPos < fromPos ? -1 : 1;
      const at = dir === -1 ? from.start - 1 : from.end + 1;
      if (at < 0 || at >= exerciseOrder.length) return;
      const other = groupSpan(at);
      const start = Math.min(from.start, other.start);
      const end = Math.max(from.end, other.end);
      const block = exerciseOrder.slice(from.start, from.end + 1);
      const neighbour = exerciseOrder.slice(other.start, other.end + 1);
      const next = [...exerciseOrder];
      next.splice(start, end - start + 1);
      next.splice(
        start,
        0,
        ...(dir === -1 ? [...block, ...neighbour] : [...neighbour, ...block])
      );
      setExerciseOrder(next);
      const currentStep = queue[index];
      if (currentStep?.type !== "exercise") return;
      const currentPos = exerciseOrder.findIndex(
        (e) => e.id === currentStep.exerciseId
      );
      if (currentPos < 0) return;
      let targetExercise: PlannedExercise | undefined;
      let targetSet = 1;
      for (let p = currentPos; p < next.length; p++) {
        const ex = next[p];
        for (let s = 1; s <= ex.sets; s++) {
          if (!completedSets.has(`${ex.id}:${s}`)) {
            targetExercise = ex;
            targetSet = s;
            break;
          }
        }
        if (targetExercise) break;
      }
      if (!targetExercise) return;
      rebuildQueue(next, {
        type: "exercise",
        exerciseId: targetExercise.id,
        setNumber: targetSet,
        totalSets: targetExercise.sets,
      } as ExecutionStep);
    },
    [exerciseOrder, queue, index, rebuildQueue, groupSpan, completedSets]
  );

  const overview = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        muscleGroup: string;
        groupLabel?: string;
        sets: {
          setNumber: number;
          totalSets: number;
          index: number;
          exerciseId: string;
        }[];
      }
    >();
    queue.forEach((s, i) => {
      if (s.type !== "exercise") return;
      const existing = groups.get(s.exerciseId);
      const group = existing ?? {
        id: s.exerciseId,
        name: s.exerciseName,
        muscleGroup: s.muscleGroup,
        groupLabel: s.groupLabel,
        sets: [],
      };
      group.sets.push({
        setNumber: s.setNumber,
        totalSets: s.totalSets,
        index: i,
        exerciseId: s.exerciseId,
      });
      groups.set(s.exerciseId, group);
    });
    return [...groups.values()];
  }, [queue]);
  const exerciseSteps = queue.filter((s) => s.type === "exercise");
  const totalSets = exerciseSteps.length;
  const doneSets = exerciseSteps.filter((s) => completedSets.has(stepKey(s)))
    .length;
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const newLoggedId = () =>
    `ls-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const persistLoggedSets = useCallback(
    async (sets: LoggedSet[]) => {
      if (sets.length === 0) return;
      const today = new Date().toISOString().slice(0, 10);
      const entries = sets.map((s) => ({
        id: s.id ?? newLoggedId(),
        exerciseId: "",
        exerciseName: s.exerciseName ?? "",
        muscleGroup: s.muscleGroup ?? "",
        setNumber: s.setNumber ?? 0,
        unit: s.unit ?? "reps",
        weight: s.weight,
        reps: s.reps,
        duration: s.duration ?? 0,
        rpe: s.rpe,
        notes: s.notes,
        date: today,
      }));
      try {
        await api.post("/api/logged-sets", { entries });
        entries.forEach((e) => syncedIdsRef.current.add(e.id));
        queryClient.invalidateQueries({ queryKey: queryKeys.progress });
        queryClient.invalidateQueries({ queryKey: queryKeys.loggedSets });
      } catch {
        // silently fail — sets stay unsynced and are retried when the workout ends
      }
    },
    [queryClient]
  );

  const step = queue[index];
  const nextStep = queue[index + 1];

  const handleSetLogged = useCallback(
    (set: LoggedSet) => {
      if (step?.type === "exercise") {
        set.exerciseName = step.exerciseName;
        set.muscleGroup = step.muscleGroup;
        set.setNumber = step.setNumber;
        set.unit = step.unit ?? "reps";
      }
      if (!set.id) set.id = newLoggedId();
      loggedSetsRef.current.push(set);
      persistLoggedSets([set]);
      setCompletedSets((prev) => new Set(prev).add(stepKey(step)));
      setLogging(false);
      setIndex((i) => i + 1);
    },
    [step, stepKey, persistLoggedSets]
  );

  const handleSkip = useCallback(() => {
    setLogging(false);
    if (step?.type === "exercise") {
      setPendingSets((s) => [...s, step]);
    }
    setIndex((i) => i + 1);
  }, [step]);

  const handleLogPending = useCallback(
    (set: LoggedSet) => {
      if (pendingIdx === null) return;
      const pendingStep = pendingSets[pendingIdx];
      if (pendingStep?.type === "exercise") {
        set.exerciseName = pendingStep.exerciseName;
        set.muscleGroup = pendingStep.muscleGroup;
        set.setNumber = pendingStep.setNumber;
        set.unit = pendingStep.unit ?? "reps";
      }
      if (!set.id) set.id = newLoggedId();
      loggedSetsRef.current.push(set);
      setCompletedSets((prev) => new Set(prev).add(stepKey(pendingStep)));
      setPendingSets((prev) => prev.filter((_, i) => i !== pendingIdx));
      setPendingIdx(null);
      persistLoggedSets([set]);
    },
    [pendingIdx, pendingSets, persistLoggedSets, stepKey]
  );

  const dismissPending = useCallback((removeIdx: number) => {
    setPendingSets((prev) => prev.filter((_, i) => i !== removeIdx));
    setPendingIdx(null);
  }, []);

  const hasPending = pendingSets.length > 0;

  const handleEndWorkout = useCallback(() => {
    clearWorkoutState();
    router.push("/dashboard");
  }, [router]);

  const pendingModal = (
    <Modal
      open={showPending}
      onClose={() => {
        setShowPending(false);
        setPendingIdx(null);
      }}
      title="Skipped sets"
    >
      {pendingSets.length === 0 ? (
        <p className="text-sm text-chalk-faint">No skipped sets.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingSets.map((ps, i) => {
            if (ps.type !== "exercise") return null;
            return (
              <div
                key={`${ps.exerciseId}-${ps.setNumber}-${i}`}
                className="flex items-center justify-between rounded-[10px] bg-rubber-2 px-3.5 py-3"
              >
                {pendingIdx === i ? (
                  <div className="w-full">
                    <p className="mb-2 text-sm font-semibold text-chalk">
                      {ps.exerciseName} · Set {ps.setNumber} of {ps.totalSets}
                    </p>
                    <LogSetForm
                      unit={ps.unit ?? "reps"}
                      suggestedWeight={ps.weight ?? 0}
                      suggestedReps={ps.reps ?? 0}
                      suggestedDuration={ps.duration ?? 0}
                      onDone={handleLogPending}
                    />
                    <button
                      onClick={() => setPendingIdx(null)}
                      className="mt-2 w-full rounded-[10px] border border-rubber-2 py-2 text-xs font-semibold text-chalk-faint"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-chalk">
                        {ps.exerciseName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
                        Set {ps.setNumber} of {ps.totalSets} · {ps.muscleGroup}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPendingIdx(i)}
                        className="rounded-lg bg-plate-green px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        Log
                      </button>
                      <button
                        onClick={() => dismissPending(i)}
                        className="rounded-lg border border-rubber-2 px-3 py-1.5 text-[11px] font-semibold text-chalk-faint"
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );

  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) {
      const unsynced = loggedSetsRef.current.filter(
        (s) => !syncedIdsRef.current.has(s.id ?? "")
      );
      persistLoggedSets(unsynced);
      clearWorkoutState();
    }
  }, [index, queue.length, persistLoggedSets]);

  useEffect(() => {
    if (queue.length === 0) return;
    saveWorkoutState({
      index,
      completedSets: Array.from(completedSets),
      pendingSets,
      exerciseOrder,
      queue,
      loggedSets: loggedSetsRef.current,
      syncedIds: Array.from(syncedIdsRef.current),
    });
  }, [index, completedSets, pendingSets, exerciseOrder, queue]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading workout…</p>
      </div>
    );
  }

  if (!todaysWorkout) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="mb-2 font-display text-2xl font-semibold text-chalk">
          Rest day
        </h1>
        <p className="mb-6 text-sm text-chalk-faint">
          No workout scheduled for today. Nice work staying consistent!
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-[10px] bg-plate-green px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!step) {
    return (
      <>
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="mb-2 font-display text-2xl font-semibold text-chalk">
          Workout complete
        </h1>
        <p className="mb-6 text-sm text-chalk-faint">
          Nice work — {todaysWorkout?.dayLabel ?? "Today"} logged.
        </p>
        {hasPending && (
          <div className="card-3d mb-6 w-full rounded-[12px] bg-rubber p-4 text-left">
            <div className="mb-2 flex items-center gap-2">
              <IconAlertTriangle size={16} className="text-plate-yellow" />
              <p className="text-sm font-semibold text-chalk">
                {pendingSets.length} skipped set
                {pendingSets.length === 1 ? "" : "s"} not logged
              </p>
            </div>
            <p className="mb-4 text-xs text-chalk-faint">
              You skipped {pendingSets.length}{" "}
              {pendingSets.length === 1 ? "set" : "sets"} earlier. Log
              them now or they&apos;ll be discarded.
            </p>
            <button
              onClick={() => setShowPending(true)}
              className="w-full rounded-[10px] bg-plate-green py-3 font-display text-sm font-semibold uppercase tracking-wide text-white"
            >
              Log skipped sets
            </button>
          </div>
        )}
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-[10px] border border-rubber-2 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-chalk"
        >
          Back to dashboard
        </button>
      </div>
      {pendingModal}
      </>
    );
  }

  const canReorderUp = (pos: number) => pos >= 0 && groupSpan(pos).start > 0;

  const canReorderDown = (pos: number) =>
    pos >= 0 && groupSpan(pos).end < exerciseOrder.length - 1;

  return (
    <div className="px-5 pt-2">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-chalk-faint">
          {(todaysWorkout?.dayLabel ?? "").toUpperCase()}
        </span>
        <button onClick={() => setShowEndConfirm(true)} aria-label="End workout">
          <IconX size={20} className="text-chalk-faint" />
        </button>
      </div>

      <div className="card-3d mb-5 rounded-[12px] bg-rubber p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-chalk-faint">
            Today&apos;s workout
          </span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-bold text-chalk">
              {doneSets}/{totalSets} sets
            </span>
            {hasPending && (
              <button
                onClick={() => setShowPending(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-plate-yellow"
              >
                Skipped ({pendingSets.length})
              </button>
            )}
            <button
              onClick={() => setShowOverview(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#7FB2E8]"
            >
              <IconList size={14} /> View all
            </button>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-rubber-2">
          <div
            className="h-full rounded-full bg-plate-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {step.type === "exercise" ? (
        <ExerciseStep
          step={step}
          nextStep={nextStep}
          logging={logging}
          onLogToggle={() => setLogging((l) => !l)}
          onDone={handleSkip}
          onSetLogged={handleSetLogged}
        />
      ) : (
        <RestStep key={index} step={step} onDone={() => setIndex((i) => i + 1)} />
      )}

      <Modal
        open={showOverview}
        onClose={() => {
          setShowOverview(false);
          setShowReorder(false);
        }}
        title={showReorder ? "Reorder exercises" : "Today's workout"}
        headerAction={
          showReorder ? (
            <button
              onClick={() => setShowReorder(false)}
              className="flex items-center gap-1 rounded-full border border-plate-green/40 bg-plate-green/10 px-2.5 py-1 text-[11px] font-semibold text-plate-green transition-colors hover:border-plate-green hover:bg-plate-green hover:text-white"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => setShowReorder(true)}
              className="flex items-center gap-1 rounded-full border border-rubber-2 px-2.5 py-1 text-[11px] font-semibold text-chalk-dim transition-colors hover:border-plate-yellow hover:text-plate-yellow"
            >
              <IconReorder size={12} />
              Reorder
            </button>
          )
        }
        headerBelow={
          !showReorder ? (
            <div className="mb-4 rounded-[10px] bg-rubber-2 px-3.5 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-chalk-faint">
                  Progress
                </span>
                <span className="font-mono text-[11px] font-bold text-[#5DCAA5]">
                  {doneSets}/{totalSets} sets · {progressPct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-rubber">
                <div
                  className="h-full rounded-full bg-plate-green transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : undefined
        }
      >
        {showReorder ? (
          <div className="flex flex-col gap-2">
            {exerciseOrder.map((ex, pos) => {
              const canUp = canReorderUp(pos);
              const canDown = canReorderDown(pos);
              return (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-[10px] bg-rubber-2 px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-chalk">
                      {ex.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
                      {ex.sets} sets · {ex.muscleGroup}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      disabled={!canUp}
                      onClick={() => reorderExercise(pos, pos - 1)}
                      className="rounded-lg border border-rubber-2 p-1.5 text-chalk-faint disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <IconArrowUp size={15} />
                    </button>
                    <button
                      disabled={!canDown}
                      onClick={() => reorderExercise(pos, pos + 1)}
                      className="rounded-lg border border-rubber-2 p-1.5 text-chalk-faint disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <IconArrowDown size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {overview.map((g) => (
              <div key={g.id}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-chalk">{g.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-chalk-faint">
                      {g.muscleGroup}
                    </p>
                  </div>
                  {g.groupLabel && (
                    <span className="font-mono text-[10px] font-bold text-plate-yellow">
                      {g.groupLabel}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.sets.map((set) => {
                    const done = completedSets.has(
                      `${set.exerciseId}:${set.setNumber}`
                    );
                    const current = set.index === index && !done;
                    return (
                      <span
                        key={set.index}
                        className={`rounded-md px-2.5 py-1.5 font-mono text-[11px] font-bold ${
                          done
                            ? "bg-plate-green text-white"
                            : current
                              ? "border border-plate-yellow text-plate-yellow"
                              : "bg-rubber-2 text-chalk-faint"
                        }`}
                      >
                        {set.setNumber}/{set.totalSets}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {pendingModal}

      <Modal
        open={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        title="End workout?"
      >
        <p className="mb-5 text-sm text-chalk-faint">
          You still have {totalSets - doneSets} set{totalSets - doneSets === 1 ? "" : "s"} remaining. Are you sure you want to end this workout?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowEndConfirm(false)}
            className="flex-1 rounded-[10px] border border-rubber-2 py-3 text-sm font-semibold text-chalk"
          >
            Keep going
          </button>
          <button
            onClick={handleEndWorkout}
            className="flex-1 rounded-[10px] bg-plate-red py-3 text-sm font-semibold text-white"
          >
            End workout
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ExerciseStep({
  step,
  nextStep,
  logging,
  onLogToggle,
  onDone,
  onSetLogged,
}: {
  step: Extract<ReturnType<typeof flattenDay>[number], { type: "exercise" }>;
  nextStep: ReturnType<typeof flattenDay>[number] | undefined;
  logging: boolean;
  onLogToggle: () => void;
  onDone: () => void;
  onSetLogged: (set: LoggedSet) => void;
}) {
  const { unit, display } = useUnits();
  return (
    <div>
      <div className="card-3d rounded-[18px] bg-rubber px-5.5 py-7 text-center">
        <p className="mb-2.5 font-mono text-[13px] font-bold tracking-wide text-plate-yellow">
          {step.groupLabel ? `${step.groupLabel} · ` : ""}SET {step.setNumber} OF{" "}
          {step.totalSets}
        </p>
        <h1 className="mb-1 font-display text-2xl font-semibold text-chalk">
          {step.exerciseName}
        </h1>
        <p className="mb-6.5 text-xs text-chalk-faint">{step.muscleGroup}</p>
        <p className="mb-1.5 font-mono text-[44px] font-bold text-chalk">
          {step.unit === "time" ? (
            <>
              {step.weight ? (
                <>
                  {display(step.weight)}
                  <span className="text-xl text-chalk-faint">{unit}</span> ×{" "}
                </>
              ) : null}
              {step.duration}
              <span className="text-xl text-chalk-faint">s hold</span>
            </>
          ) : (
            <>
              {display(step.weight ?? 0)}
              <span className="text-xl text-chalk-faint">{unit}</span> × {step.reps}
              <span className="text-xl text-chalk-faint">reps</span>
            </>
          )}
        </p>
        <p className="mb-7 text-xs text-chalk-faint">Last time: {step.lastTime}</p>

        {logging ? (
          <LogSetForm
            unit={step.unit ?? "reps"}
            suggestedWeight={step.weight ?? 0}
            suggestedReps={step.reps ?? 0}
            suggestedDuration={step.duration ?? 0}
            onDone={onSetLogged}
          />
        ) : (
          <>
            <button
              onClick={onLogToggle}
              className="w-full rounded-[10px] bg-plate-green py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white"
            >
              Mark set done
            </button>
            <button
              onClick={onDone}
              className="mt-2.5 w-full rounded-[10px] border border-rubber-2 py-3 text-xs font-semibold text-chalk-faint"
            >
              Skip & log later
            </button>
          </>
        )}
      </div>

      {nextStep && (
        <div className="card-3d mt-4 flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3">
          <span className="text-[11px] uppercase tracking-wide text-chalk-faint">
            Up next
          </span>
          <span className="text-[13px] font-medium text-chalk-dim">
            {nextStep.type === "rest"
              ? `Rest · ${nextStep.seconds}s`
              : `${nextStep.exerciseName} · Set ${nextStep.setNumber} of ${nextStep.totalSets}`}
          </span>
        </div>
      )}
    </div>
  );
}

const CIRCUMFERENCE = 2 * Math.PI * 96;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(freq: number, offset: number, duration: number, gainPeak: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playTac() {
  try {
    if ("vibrate" in navigator) navigator.vibrate(40);
    beep(1200, 0, 0.08, 0.2);
  } catch {
    // audio/vibration unavailable — ignore
  }
}

function playStrongAlert() {
  try {
    if ("vibrate" in navigator) navigator.vibrate([250, 120, 250, 120, 500]);
    beep(880, 0, 0.2, 0.4);
    beep(1174.66, 0.28, 0.32, 0.5);
  } catch {
    // audio/vibration unavailable — ignore
  }
}

function RestStep({
  step,
  onDone,
}: {
  step: Extract<ReturnType<typeof flattenDay>[number], { type: "rest" }>;
  onDone: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(step.seconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    if (secondsLeft > 0 && secondsLeft <= 3) {
      playTac();
    }
  }, [secondsLeft, paused]);

  useEffect(() => {
    if (secondsLeft === 0 && step.seconds > 0) {
      playStrongAlert();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, step.seconds]);

  const pct = secondsLeft / step.seconds;
  const offset = CIRCUMFERENCE * (1 - pct);
  const color = pct < 0.2 ? "#D0202E" : pct < 0.5 ? "#E8B923" : "#2E8B57";
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center pt-3">
      <div className="relative mb-7 h-[220px] w-[220px]">
        <svg width={220} height={220} className="-rotate-90">
          <circle
            cx={110}
            cy={110}
            r={96}
            fill="none"
            stroke="#2D2F33"
            strokeWidth={16}
          />
          <circle
            cx={110}
            cy={110}
            r={96}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[42px] font-bold text-chalk">
            {mm}:{ss}
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-wide text-chalk-faint">
            Rest
          </span>
        </div>
      </div>

      <div className="flex w-full gap-2.5">
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex-1 rounded-[10px] border border-rubber-2 bg-rubber py-3.5 text-sm font-semibold text-chalk"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={onDone}
          className="flex-1 rounded-[10px] border border-rubber-2 py-3.5 text-sm font-semibold text-chalk-faint"
        >
          Skip rest
        </button>
      </div>

      <p className="mt-5.5 text-center text-[13px] text-chalk-faint">
        Next up: <b className="font-semibold text-chalk-dim">{step.nextExerciseName} · {step.nextSetLabel}</b>
      </p>
    </div>
  );
}
