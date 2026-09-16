"use client";

import { useEffect } from "react";
import { IconX } from "@tabler/icons-react";

export function Modal({
  open,
  onClose,
  title,
  headerAction,
  headerBelow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  headerAction?: React.ReactNode;
  headerBelow?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div
        className="card-3d max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-rubber px-5 pb-8 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 bg-rubber px-5 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <p className="truncate font-display text-lg font-semibold text-chalk">
                {title}
              </p>
              {headerAction}
            </div>
            <button onClick={onClose} aria-label="Close" className="ml-2 shrink-0">
              <IconX size={20} className="text-chalk-faint" />
            </button>
          </div>
          {headerBelow}
        </div>
        {children}
      </div>
    </div>
  );
}
