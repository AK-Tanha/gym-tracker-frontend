"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(
        new URL("../lib/service-worker.js", import.meta.url),
        { scope: "/", updateViaCache: "none" }
      );
    }
  }, []);

  return null;
}
