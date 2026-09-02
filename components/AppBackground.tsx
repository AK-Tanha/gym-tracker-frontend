"use client";

import { usePathname } from "next/navigation";

export default function AppBackground() {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-iron"
    >
      <div className="absolute -left-16 -top-24 h-72 w-72 rounded-full bg-plate-red/20 blur-[90px]" />
      <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-plate-blue/25 blur-[100px]" />

      <div
        className="absolute -right-16 top-10 h-56 w-40 bg-plate-red/10"
        style={{ transform: "skewX(-18deg)" }}
      />
      <div
        className="absolute right-8 top-40 h-40 w-28 bg-plate-red/5"
        style={{ transform: "skewX(-14deg)" }}
      />

      <div
        className="absolute -left-20 top-1/2 h-64 w-44 bg-plate-blue/10"
        style={{ transform: "skewX(14deg)" }}
      />
      <div
        className="absolute left-2 top-2/3 h-48 w-32 bg-plate-blue/5"
        style={{ transform: "skewX(18deg)" }}
      />

      <div className="absolute left-6 top-40 h-px w-24 rotate-45 bg-plate-red/30" />
      <div className="absolute right-8 top-3/4 h-px w-20 -rotate-45 bg-plate-red/25" />
    </div>
  );
}
