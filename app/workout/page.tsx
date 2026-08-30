"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { todaysWorkout } from "@/lib/mockData";
import { flattenDay } from "@/lib/flattenDay";

export default function WorkoutRunnerPage() {
  const router = useRouter();
  const queue = useMemo(() => flattenDay(todaysWorkout.exercises), []);
  const [index, setIndex] = useState(0);

  const step = queue[index];
  const nextStep = queue[index + 1];

  if (!step) {
    // Ran off the end of the queue: session complete.
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="mb-2 font-display text-2xl font-semibold text-chalk">
          Workout complete
        </h1>
        <p className="mb-6 text-sm text-chalk-faint">
          Nice work — {todaysWorkout.dayLabel} logged.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-[10px] bg-plate-green px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white"
        >
          Back to today
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-mono text-xs text-chalk-faint">
          {todaysWorkout.dayLabel.toUpperCase()}
        </span>
        <button onClick={() => router.push("/")} aria-label="End workout">
          <IconX size={20} className="text-chalk-faint" />
        </button>
      </div>

      {step.type === "exercise" ? (
        <ExerciseStep
          step={step}
          nextStep={nextStep}
          onDone={() => setIndex((i) => i + 1)}
        />
      ) : (
        <RestStep step={step} onDone={() => setIndex((i) => i + 1)} />
      )}
    </div>
  );
}

function ExerciseStep({
  step,
  nextStep,
  onDone,
}: {
  step: Extract<ReturnType<typeof flattenDay>[number], { type: "exercise" }>;
  nextStep: ReturnType<typeof flattenDay>[number] | undefined;
  onDone: () => void;
}) {
  return (
    <div>
      <div className="rounded-[18px] bg-rubber px-5.5 py-7 text-center">
        <p className="mb-2.5 font-mono text-[13px] font-bold tracking-wide text-plate-yellow">
          {step.groupLabel ? `${step.groupLabel} · ` : ""}SET {step.setNumber} OF{" "}
          {step.totalSets}
        </p>
        <h1 className="mb-1 font-display text-2xl font-semibold text-chalk">
          {step.exerciseName}
        </h1>
        <p className="mb-6.5 text-xs text-chalk-faint">{step.muscleGroup}</p>
        <p className="mb-1.5 font-mono text-[44px] font-bold text-chalk">
          60<span className="text-xl text-chalk-faint">kg</span> × 8
          <span className="text-xl text-chalk-faint">reps</span>
        </p>
        <p className="mb-7 text-xs text-chalk-faint">Last time: 57.5kg × 8</p>
        <button
          onClick={onDone}
          className="w-full rounded-[10px] bg-plate-green py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white"
        >
          Mark set done
        </button>
      </div>

      {nextStep && (
        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3">
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
    setSecondsLeft(step.seconds);
    setPaused(false);
  }, [step]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, step]);

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
