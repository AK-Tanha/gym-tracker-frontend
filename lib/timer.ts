"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  playStrongAlert,
  startSilentKeepAlive,
  stopSilentKeepAlive,
} from "@/lib/sound";
import {
  cancelTimerNotification,
  ensureNotificationPermission,
  showTimerNotification,
} from "@/lib/notify";

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

// In-app alarm replayed on wake when a system notification could not be
// posted (permission denied / notifications unsupported). Module level so an
// alarm is not lost if the timer's component unmounts first.
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

// Shared keep-alive so overlapping timers don't stop each other's audio.
let keepAliveCount = 0;

/**
 * Timer alarm plumbing:
 * - keeps the page unfrozen while the timer runs (so it fires on time);
 * - asks for notification permission the first time a timer runs;
 * - rings through a system notification when the screen is off (Web Audio is
 *   silent there), or through the loud in-app alarm when the app is visible.
 *
 * Returns the function to call when the timer ends.
 */
export function useTimerAlarm({
  active,
  title,
  body,
}: {
  active: boolean;
  title: string;
  body: string;
}): () => void {
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
  }, [title, body]);

  useEffect(() => {
    if (!active) return;
    keepAliveCount += 1;
    startSilentKeepAlive();
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      void ensureNotificationPermission();
    }
    return () => {
      keepAliveCount = Math.max(0, keepAliveCount - 1);
      if (keepAliveCount === 0) stopSilentKeepAlive();
    };
  }, [active]);

  return useCallback(() => {
    if (isAppHidden()) {
      void showTimerNotification(titleRef.current, bodyRef.current).then(
        (posted) => {
          // Fall back to ringing in-app once the display is back on.
          if (!posted) {
            pendingAlert = true;
            ensureAlertSubscription();
          }
        }
      );
      return;
    }
    cancelTimerNotification();
    playStrongAlert();
  }, []);
}
