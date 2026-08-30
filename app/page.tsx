import Link from "next/link";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { todaysWorkout, weekStrip } from "@/lib/mockData";

export default function TodayPage() {
  const totalSets = todaysWorkout.exercises.reduce((sum, e) => sum + e.sets, 0);
  const estMinutes = Math.round(totalSets * 3.2); // rough estimate for display

  return (
    <div className="px-5 pt-2">
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
        Sunday
      </p>

      <div className="mb-5 mt-3 flex gap-1.5">
        {weekStrip.map((day, i) => {
          const isToday = i === 6;
          return (
            <div
              key={i}
              className={`flex h-8.5 flex-1 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                isToday
                  ? "bg-plate-red text-white"
                  : day.isWorkout
                    ? "bg-rubber-2 text-chalk-dim"
                    : "bg-rubber text-chalk-faint"
              }`}
            >
              {day.label}
            </div>
          );
        })}
      </div>

      <div className="mb-4 rounded-2xl bg-rubber p-5">
        <h1 className="mb-2 font-display text-2xl font-semibold text-chalk">
          {todaysWorkout.dayLabel}
        </h1>
        <div className="mb-4.5 flex items-center gap-2">
          <span className="rounded-md bg-plate-blue-bg px-2.5 py-1 text-[11px] font-semibold text-[#7FB2E8]">
            Push day
          </span>
          <span className="text-[11px] text-chalk-faint">
            {todaysWorkout.exercises.length} exercises · ~{estMinutes} min
          </span>
        </div>
        <Link
          href="/workout"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-plate-red py-4 font-display text-[15px] font-semibold uppercase tracking-wide text-white active:scale-[0.98]"
        >
          <IconPlayerPlayFilled size={16} />
          Start workout
        </Link>
      </div>

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Today&apos;s exercises
      </p>
      <div className="flex flex-col gap-2">
        {todaysWorkout.exercises.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3"
          >
            <div>
              <p className="text-sm font-medium text-chalk">{ex.name}</p>
              <p className="mt-0.5 font-mono text-xs text-chalk-faint">
                {ex.sets} sets × {ex.reps} reps
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
    </div>
  );
}
