"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGardenEntry } from "../actions";

const PLANT_TYPES = ["vegetable", "fruit", "herb", "flower", "tree", "shrub", "other"];

type PlantInput = { name: string; type: string; yield_notes: string };

export function NewGardenForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [plants, setPlants] = useState<PlantInput[]>([{ name: "", type: "", yield_notes: "" }]);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i + 2);

  function addPlant() {
    setPlants([...plants, { name: "", type: "", yield_notes: "" }]);
  }

  function updatePlant(i: number, field: keyof PlantInput, value: string) {
    setPlants(plants.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function removePlant(i: number) {
    setPlants(plants.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validPlants = plants.filter(p => p.name.trim());
    fd.set("plants", JSON.stringify(validPlants));
    startTransition(async () => {
      const res = await createGardenEntry(fd);
      if (res.success) {
        router.push(`/dashboard/garden/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Season <span className="text-red-500">*</span></label>
          <select name="season" required defaultValue="spring" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
            <option value="spring">🌱 Spring</option>
            <option value="summer">☀️ Summer</option>
            <option value="fall">🍂 Fall</option>
            <option value="winter">❄️ Winter</option>
            <option value="year-round">🌿 Year-round</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Year</label>
          <select name="year" defaultValue={currentYear} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Title (optional)</label>
        <input name="title" type="text" placeholder="e.g. The Big Tomato Year, Grandma's Herb Garden…" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">Notes</label>
        <textarea name="notes" rows={3} placeholder="What did you grow this season? What worked, what didn't? How did it make you feel?" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none" />
      </div>

      {/* Plants */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[var(--foreground)]">Plants</label>
          <button type="button" onClick={addPlant} className="text-xs text-[var(--accent)] hover:underline">+ Add plant</button>
        </div>
        <div className="mt-2 space-y-2">
          {plants.map((plant, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={plant.name}
                onChange={e => updatePlant(i, "name", e.target.value)}
                placeholder="Plant name (e.g. Roma tomatoes)"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              <select
                value={plant.type}
                onChange={e => updatePlant(i, "type", e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Type</option>
                {PLANT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input
                type="text"
                value={plant.yield_notes}
                onChange={e => updatePlant(i, "yield_notes", e.target.value)}
                placeholder="Yield / notes"
                className="w-32 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              {plants.length > 1 && (
                <button type="button" onClick={() => removePlant(i)} className="rounded-lg p-2 text-[var(--muted)] hover:text-red-500">×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {isPending ? "Saving…" : "Save season"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
