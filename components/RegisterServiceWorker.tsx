"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (hadController) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  return null;
}