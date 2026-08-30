import { programs, myWorkouts } from "@/lib/mockData";

export default function ProgramsPage() {
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
              <button className="rounded-lg border border-plate-blue px-3.5 py-1.5 text-xs font-semibold text-[#7FB2E8]">
                Use program
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
              <button className="rounded-lg border border-plate-blue px-3.5 py-1.5 text-xs font-semibold text-[#7FB2E8]">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
