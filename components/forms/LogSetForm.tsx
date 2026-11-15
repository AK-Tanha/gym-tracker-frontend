"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, Select, FormButton, FieldError } from "./primitives";
import { ExerciseUnit } from "@/lib/types";
import { useUnits } from "@/components/UnitsProvider";
import { fmt } from "@/lib/units";
import { playTac } from "@/lib/sound";
import { useAppVisible, useTimerAlarm } from "@/lib/timer";

export type LoggedSet = {
  id?: string;
  exerciseId?: string;
  weight: number;
  reps: number;
  duration: number;
  unit: ExerciseUnit;
  rpe: number | null;
  notes: string;
  exerciseName?: string;
  muscleGroup?: string;
  setNumber?: number;
};

const EMPTY: LoggedSet = { weight: 0, reps: 0, duration: 0, unit: "reps", rpe: null, notes: "" };

function clockLabel(seconds: number) {
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function LogSetForm({
  unit = "reps",
  suggestedWeight,
  suggestedReps,
  suggestedDuration,
  onDone,
  submitting,
  autoStartTimer = false,
  label,
}: {
  unit?: ExerciseUnit;
  suggestedWeight: number;
  suggestedReps: number;
  suggestedDuration: number;
  onDone: (set: LoggedSet) => void;
  submitting?: boolean;
  autoStartTimer?: boolean;
  /** Exercise name, used in the end-of-timer notification. */
  label?: string;
}) {
  const { unit: weightUnit, toUnit, toKg } = useUnits();
  const [set, setSet] = useState<LoggedSet>({
    weight: suggestedWeight,
    reps: suggestedReps,
    duration: suggestedDuration,
    unit,
    rpe: null,
    notes: "",
  });
  const [weightInput, setWeightInput] = useState(() => fmt(toUnit(suggestedWeight)));
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for time-based (hold) exercises.
  const timed = unit === "time" && autoStartTimer;
  const target = set.duration;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(timed && target >= 1);
  const [finished, setFinished] = useState(false);
  const elapsedRef = useRef(0);
  const finishedRef = useRef(false);
  // Fixed wall-clock start: throttled timers in a backgrounded app still
  // resolve to the correct elapsed time.
  const startedAtRef = useRef(0);
  const alarm = useTimerAlarm({
    active: timed && running,
    title: "Time's up",
    body: label ? `${label} — hold complete` : "Hold complete",
  });

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const resetTimer = (start: boolean) => {
    elapsedRef.current = 0;
    startedAtRef.current = Date.now();
    finishedRef.current = false;
    setElapsed(0);
    setFinished(false);
    setRunning(start);
  };

  const tick = useCallback(() => {
    if (!timed || !running || finishedRef.current || target < 1) return;
    if (!startedAtRef.current) return;
    const next = Math.min(
      target,
      Math.floor((Date.now() - startedAtRef.current) / 1000)
    );
    if (next !== elapsedRef.current) {
      elapsedRef.current = next;
      setElapsed(next);
    }
    if (next >= target) {
      finishedRef.current = true;
      setRunning(false);
      setFinished(true);
      alarm();
    }
  }, [timed, running, target, alarm]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running, tick]);

  // Catch up instantly when the app is foregrounded again.
  useAppVisible(tick);

  const remaining = Math.max(0, target - elapsed);

  useEffect(() => {
    if (!timed || !running || finished) return;
    if (remaining > 0 && remaining <= 3) playTac();
  }, [timed, running, finished, remaining]);

  const changeDuration = (value: number) => {
    setSet((s) => ({ ...s, duration: value }));
    resetTimer(timed && value >= 1);
  };

  const togglePause = () => {
    if (finished) {
      resetTimer(true);
      return;
    }
    if (running) {
      // Freeze on the exact elapsed second so resuming doesn't skip ahead.
      const now = Math.min(
        target,
        Math.floor((Date.now() - startedAtRef.current) / 1000)
      );
      elapsedRef.current = now;
      setElapsed(now);
      setRunning(false);
    } else {
      startedAtRef.current = Date.now() - elapsedRef.current * 1000;
      setRunning(true);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unit === "reps") {
      if (set.reps < 1) {
        setError("Enter reps completed.");
        return;
      }
    } else if (set.duration < 1) {
      setError("Enter seconds completed.");
      return;
    }
    const w = parseFloat(weightInput);
    // Time-based sets log the seconds actually held; the target if never started.
    const duration = timed && elapsed > 0 ? elapsed : set.duration;
    onDone({ ...set, duration, weight: Number.isNaN(w) ? 0 : toKg(w) });
    setSet({ ...EMPTY, unit });
    setWeightInput("");
    if (timed) resetTimer(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label={`Weight (${weightUnit})`}
          type="number"
          min={0}
          step="0.5"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
        />
        {unit === "reps" ? (
          <TextInput
            label="Reps"
            type="number"
            min={1}
            value={set.reps}
            onChange={(e) => setSet((s) => ({ ...s, reps: parseInt(e.target.value, 10) || 0 }))}
          />
        ) : (
          <TextInput
            label="Time (s)"
            type="number"
            min={1}
            value={set.duration}
            onChange={(e) => changeDuration(parseInt(e.target.value, 10) || 0)}
          />
        )}
      </div>
      {timed && (
        <div className="rounded-[12px] bg-rubber-2 px-3.5 py-3 text-center">
          <p
            className={`font-mono text-[40px] font-bold leading-none ${
              finished ? "text-plate-green" : remaining <= 3 ? "text-plate-red" : "text-chalk"
            }`}
          >
            {clockLabel(remaining)}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-wide text-chalk-faint">
            {finished ? "Time up — log your set" : running ? "Holding…" : "Timer paused"}
          </p>
          <div className="mt-2.5 flex justify-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-lg border border-rubber-2 bg-rubber px-3.5 py-1.5 text-[11px] font-semibold text-chalk"
            >
              {finished ? "Restart" : running ? "Pause" : "Resume"}
            </button>
            {!finished && (
              <button
                type="button"
                onClick={() => resetTimer(true)}
                className="rounded-lg border border-rubber-2 px-3.5 py-1.5 text-[11px] font-semibold text-chalk-faint"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
      <Select
        label="RPE (optional)"
        options={[
          { value: "", label: "—" },
          ...[6, 7, 8, 9, 10].map((r) => ({ value: String(r), label: `${r} RPE` })),
        ]}
        value={set.rpe === null ? "" : String(set.rpe)}
        onChange={(e) =>
          setSet((s) => ({
            ...s,
            rpe: e.target.value === "" ? null : parseInt(e.target.value, 10),
          }))
        }
      />
      <TextInput
        label="Notes (optional)"
        placeholder="e.g. felt heavy"
        value={set.notes}
        onChange={(e) => setSet((s) => ({ ...s, notes: e.target.value }))}
      />
      <FieldError error={error} />
      <FormButton type="submit" variant="success" loading={submitting}>
        Log set
      </FormButton>
    </form>
  );
}
