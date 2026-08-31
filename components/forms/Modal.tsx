"use client";

import { IconX } from "@tabler/icons-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-rubber px-5 pb-8 pt-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-chalk">{title}</p>
          <button onClick={onClose} aria-label="Close">
            <IconX size={20} className="text-chalk-faint" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
