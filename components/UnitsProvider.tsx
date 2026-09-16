"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { toKg, toUnit, WeightUnit, displayWeight, stepFor } from "@/lib/units";

type UnitsValue = {
  unit: WeightUnit;
  toUnit: (kg: number) => number;
  toKg: (value: number) => number;
  display: (kg: number) => string;
  stepFromKg: (kgStep: number) => number;
};

const UnitsContext = createContext<UnitsValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<{ units?: string }>({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<{ units?: string }>("/api/profile"),
  });

  const unit: WeightUnit = data?.units === "lbs" ? "lbs" : "kg";

  return (
    <UnitsContext.Provider
      value={{
        unit,
        toUnit: (kg) => toUnit(kg, unit),
        toKg: (v) => toKg(v, unit),
        display: (kg) => displayWeight(kg, unit),
        stepFromKg: (kgStep) => stepFor(unit, kgStep),
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits(): UnitsValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}