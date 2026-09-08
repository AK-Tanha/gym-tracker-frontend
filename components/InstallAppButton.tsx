"use client";

import { useEffect, useState } from "react";
import { IconDownload, IconChevronRight } from "@tabler/icons-react";
import { Modal } from "@/components/forms/Modal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS =
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

function runningStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari pre-13 detection
    ("standalone" in navigator && (navigator as { standalone: boolean }).standalone)
  );
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (runningStandalone()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || runningStandalone() || (!deferredPrompt && !isIOS)) {
    return null;
  }

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setShowIOS(true);
  };

  return (
    <>
      <div
        onClick={install}
        className="card-3d mb-2 flex cursor-pointer items-center justify-between rounded-[10px] bg-rubber px-3.5 py-3.5 active:bg-rubber-2"
      >
        <div className="flex items-center gap-3">
          <IconDownload size={18} className="text-chalk-dim" />
          <span className="text-sm text-chalk">Install app</span>
        </div>
        <IconChevronRight size={16} className="text-chalk-faint" />
      </div>

      <Modal open={showIOS} onClose={() => setShowIOS(false)} title="Install App">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-chalk-dim">
          <li>Tap the Share button in Safari (square with an up arrow).</li>
          <li>Scroll down and tap “Add to Home Screen”.</li>
          <li>Tap “Add” in the top-right corner.</li>
        </ol>
        <p className="mt-4 text-xs text-chalk-faint">
          Stat·Fit will then launch like a native app from your home screen.
        </p>
      </Modal>
    </>
  );
}