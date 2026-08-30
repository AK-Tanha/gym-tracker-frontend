"use client";

import { useApi, api } from "@/lib/api";
import { Program } from "@/lib/types";
import { useState } from "react";

export default function ProgramsPage() {
  const { data, loading, mutate } = useApi<{ programs: Program[]; myWorkouts: Program[] }>("/api/programs");
  const [activeProgram, setActiveProgram] = useState<string | null>("mw1");

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center px-5 pt-2">
        <p className="text-sm text-chalk-faint">Loading…</p>
      </div>
    );
  }

  const { programs, myWorkouts } = data;

  const activate = async (id: string, isOwn: boolean) => {
    setActiveProgram(id);
    const list = isOwn ? myWorkouts : programs;
    const updates: Program[] = list.map((p) => ({
      ...p,
      isActive: p.id === id,
    }));
    const payload = isOwn ? { programs, myWorkouts: updates } : { programs: updates, myWorkouts };
    try {
      await api.post("/api/programs", payload);
      mutate(payload);
    } catch {
      // ignore — UI state already updated optimistically
    }
  };

  return (
    <div className="px-5 pt-2">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-chalk-faint">
        Browse
      </p>
      <p className="mb-2.5 mt-4 text-[13px] font-semibold text-chalk-dim">
        Superadmin programs
      </p>
      <div className="flex flex-col gap-3">
        {programs.map((p) => (
          <div key={p.id} className="rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {p.name}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {p.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-chalk-faint">
                {p.daysPerWeek} days/week
              </span>
              <button
                onClick={() => activate(p.id, false)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  activeProgram === p.id || p.isActive
                    ? "bg-plate-green text-white"
                    : "border border-plate-blue text-[#7FB2E8]"
                }`}
              >
                {activeProgram === p.id || p.isActive ? "Active" : "Use program"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-2.5 mt-5 text-[13px] font-semibold text-chalk-dim">
        Your workouts
      </p>
      <div className="flex flex-col gap-3">
        {myWorkouts.map((w) => (
          <div key={w.id} className="rounded-[14px] bg-rubber px-4.5 py-4">
            <p className="mb-1 font-display text-[17px] font-semibold text-chalk">
              {w.name}
              {w.isActive && (
                <span className="ml-2 text-[11px] font-sans font-normal text-[#5DCAA5]">
                  · Active
                </span>
              )}
            </p>
            <p className="mb-3.5 text-xs leading-relaxed text-chalk-faint">
              {w.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-chalk-faint">
                Active plan
              </span>
              <button
                onClick={() => activate(w.id, true)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  activeProgram === w.id || w.isActive
                    ? "bg-plate-green text-white"
                    : "border border-plate-blue text-[#7FB2E8]"
                }`}
              >
                {activeProgram === w.id || w.isActive ? "Active" : "Edit"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}