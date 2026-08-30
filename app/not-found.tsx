import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h1 className="mb-2 font-display text-6xl font-semibold text-plate-red">
        404
      </h1>
      <p className="mb-6 text-sm text-chalk-faint">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="rounded-[10px] bg-plate-red px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white"
      >
        Back to today
      </Link>
    </div>
  );
}