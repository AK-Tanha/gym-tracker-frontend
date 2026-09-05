"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconX } from "@tabler/icons-react";
import { api, queryKeys } from "@/lib/api";
import { Program } from "@/lib/types";
import { flattenDay } from "@/lib/flattenDay";
import { getTodaysWorkout } from "@/lib/todayWorkout";
import LogSetForm, { LoggedSet } from "@/components/forms/LogSetForm";

export default function WorkoutRunnerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeProgram, isLoading } = useQuery<Program>({
    queryKey: queryKeys.activeProgram,
    queryFn: () => api.get<Program>("/api/programs/active"),
  });

  const todaysWorkout = getTodaysWorkout(activeProgram);
  const queue = useMemo(
    () => (todaysWorkout ? flattenDay(todaysWorkout.exercises) : []),
    [todaysWorkout]
  );
  const [index, setIndex] = useState(0);
  const [logging, setLogging] = useState(false);
  const loggedSetsRef = useRef<LoggedSet[]>([]);

  const persistLoggedSets = useCallback(async (sets: LoggedSet[]) => {
    if (sets.length === 0) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const entries = sets.map((s, i) => ({
        id: `ls-${Date.now()}-${i}`,
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
      await api.post("/api/logged-sets", { entries });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    } catch {
      // silently fail — sets are still tracked locally
    }
  }, [queryClient]);

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
      loggedSetsRef.current.push(set);
      setLogging(false);
      setIndex((i) => i + 1);
    },
    [step]
  );

  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) {
      persistLoggedSets(loggedSetsRef.current);
    }
  }, [index, queue.length, persistLoggedSets]);

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
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="mb-2 font-display text-2xl font-semibold text-chalk">
          Workout complete
        </h1>
        <p className="mb-6 text-sm text-chalk-faint">
          Nice work — {todaysWorkout?.dayLabel ?? "Today"} logged.
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

  return (
    <div className="px-5 pt-2">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-mono text-xs text-chalk-faint">
          {(todaysWorkout?.dayLabel ?? "").toUpperCase()}
        </span>
        <button onClick={() => router.push("/dashboard")} aria-label="End workout">
          <IconX size={20} className="text-chalk-faint" />
        </button>
      </div>

      {step.type === "exercise" ? (
        <ExerciseStep
          step={step}
          nextStep={nextStep}
          logging={logging}
          onLogToggle={() => setLogging((l) => !l)}
          onDone={() => {
            setLogging(false);
            setIndex((i) => i + 1);
          }}
          onSetLogged={handleSetLogged}
        />
      ) : (
        <RestStep key={index} step={step} onDone={() => setIndex((i) => i + 1)} />
      )}
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
                  {step.weight}
                  <span className="text-xl text-chalk-faint">kg</span> ×{" "}
                </>
              ) : null}
              {step.duration}
              <span className="text-xl text-chalk-faint">s hold</span>
            </>
          ) : (
            <>
              {step.weight}
              <span className="text-xl text-chalk-faint">kg</span> × {step.reps}
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
