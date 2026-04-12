"use client";

export function FamilyRequired() {
  return (
    <div className="flex h-64 items-center justify-center text-center px-6">
      <div>
        <p className="text-[var(--muted)]">Couldn&apos;t load your family.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-[var(--accent)] hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
