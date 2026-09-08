"use client";

import { useOffline } from "next/offline";

export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-plate-yellow px-4 py-2 text-center text-sm font-medium text-iron">
      You are offline — some features may be unavailable
    </div>
  );
}
