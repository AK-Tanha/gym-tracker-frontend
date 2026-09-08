export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-chalk">
        You&apos;re Offline
      </h1>
      <p className="text-chalk-dim">
        Check your internet connection and try again.
      </p>
    </div>
  );
}
