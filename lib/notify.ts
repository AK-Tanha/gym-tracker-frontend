"use client";

const TIMER_TAG = "gym-timer";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Asks for notification permission once; resolves false if denied/unsupported. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Posts the timer alarm as a system notification (which plays the device's
 * notification sound) — this works while the screen is off, unlike Web Audio.
 * Returns false when notifications are unavailable so the caller can fall
 * back to the in-app alarm.
 */
export async function showTimerNotification(
  title: string,
  body: string
): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return false;
  }
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    tag: TIMER_TAG,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    renotify: true,
  };
  try {
    const reg = await getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** Dismisses a previously posted timer notification. */
export function cancelTimerNotification(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistration()
    .then((reg) => reg?.getNotifications({ tag: TIMER_TAG }))
    .then((list) => list?.forEach((n) => n.close()))
    .catch(() => {
      // ignore
    });
}
