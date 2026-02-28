export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 rounded-lg bg-[var(--surface)]" />
      <div className="h-5 w-80 rounded-lg bg-[var(--surface)]" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-44 rounded-t-xl bg-[var(--surface-hover)]" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-32 rounded bg-[var(--surface-hover)]" />
              <div className="h-4 w-24 rounded bg-[var(--surface-hover)]" />
              <div className="h-3 w-full rounded bg-[var(--surface-hover)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--surface-hover)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
