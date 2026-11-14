"use client";

import { useCallback, useEffect, useRef } from "react";
import { playStrongAlert } from "@/lib/sound";

export function isAppHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/**
 * Runs `cb` whenever the app comes back to the foreground.
 * Android/iOS freeze or throttle timers while minimized, so timers must
 * resync from wall-clock time the moment the app is visible again.
 */
export function onAppVisible(cb: () => void): () => void {
  const handler = () => {
    if (!isAppHidden()) cb();
  };
  document.addEventListener("visibilitychange", handler);
  window.addEventListener("focus", handler);
  window.addEventListener("pageshow", handler);
  return () => {
    document.removeEventListener("visibilitychange", handler);
    window.removeEventListener("focus", handler);
    window.removeEventListener("pageshow", handler);
  };
}

export function useAppVisible(cb: () => void): void {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => onAppVisible(() => ref.current()), []);
}

/**
 * Plays the completion alert immediately when the app is visible, or defers
 * it until the app is foregrounded if the timer ends while minimized.
 * The pending flag lives at module level so an alert is not lost when the
 * timer's component unmounts (e.g. a rest step that finishes in background).
 */
let pendingAlert = false;
let alertSubscription = false;

function ensureAlertSubscription() {
  if (alertSubscription || typeof document === "undefined") return;
  alertSubscription = true;
  onAppVisible(() => {
    if (pendingAlert) {
      pendingAlert = false;
      playStrongAlert();
    }
  });
}

export function useForegroundAlert(): () => void {
  return useCallback(() => {
    ensureAlertSubscription();
    if (isAppHidden()) pendingAlert = true;
    else playStrongAlert();
  }, []);
}
