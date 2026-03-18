"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { useFamily } from "@/app/dashboard/FamilyContext";
import type { AdventureConfig, PresetLocation } from "./presets";
import type { AdventureLocation } from "./actions";
import {
  toggleVisited,
  updateRating,
  updateNotes,
  addCustomLocation,
  deleteLocation,
} from "./actions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MergedLocation = {
  /** DB id if saved, null if only from preset */
  id: string | null;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  visited: boolean;
  visited_date: string | null;
  rating: number | null;
  notes: string | null;
  isPreset: boolean;
  isCustom: boolean;
};

type FilterMode = "all" | "visited" | "not-visited";
type SortMode = "name" | "visited-date";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, string> = {
  baseball: "\u26be",
  fish: "\ud83c\udfA3",
  trees: "\ud83c\udf32",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mergeLocations(
  presets: PresetLocation[],
  saved: AdventureLocation[],
): MergedLocation[] {
  const savedMap = new Map<string, AdventureLocation>();
  for (const s of saved) savedMap.set(s.name, s);

  const merged: MergedLocation[] = [];
  const presetNames = new Set<string>();

  // Preset locations first
  for (const p of presets) {
    presetNames.add(p.name);
    const s = savedMap.get(p.name);
    merged.push({
      id: s?.id ?? null,
      name: p.name,
      description: s?.description ?? p.description,
      latitude: s?.latitude ?? p.latitude,
      longitude: s?.longitude ?? p.longitude,
      visited: s?.visited ?? false,
      visited_date: s?.visited_date ?? null,
      rating: s?.rating ?? null,
      notes: s?.notes ?? null,
      isPreset: true,
      isCustom: false,
    });
  }

  // Custom (non-preset) saved locations
  for (const s of saved) {
    if (!presetNames.has(s.name)) {
      merged.push({
        id: s.id,
        name: s.name,
        description: s.description,
        latitude: s.latitude,
        longitude: s.longitude,
        visited: s.visited,
        visited_date: s.visited_date,
        rating: s.rating,
        notes: s.notes,
        isPreset: false,
        isCustom: true,
      });
    }
  }

  return merged;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({
  rating,
  onRate,
  disabled,
}: {
  rating: number | null;
  onRate: (r: number) => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="text-lg leading-none disabled:cursor-default"
          style={{
            color:
              star <= (hover || rating || 0)
                ? "var(--accent)"
                : "var(--muted)",
          }}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Location Card                                                      */
/* ------------------------------------------------------------------ */

function LocationCard({
  loc,
  config,
  isPending,
  onToggleVisited,
  onRate,
  onNotesChange,
  onDelete,
}: {
  loc: MergedLocation;
  config: AdventureConfig;
  isPending: boolean;
  onToggleVisited: () => void;
  onRate: (r: number) => void;
  onNotesChange: (notes: string) => void;
  onDelete?: () => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(loc.notes || "");

  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        borderColor: "var(--border)",
        backgroundColor: loc.visited ? "var(--card)" : "var(--surface)",
        opacity: loc.visited ? 1 : 0.65,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3
            className="font-display font-semibold text-sm truncate"
            style={{ color: "var(--foreground)" }}
          >
            {loc.name}
          </h3>
          {loc.description && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--muted)" }}
            >
              {loc.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {loc.isCustom && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="text-xs px-1.5 py-0.5 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
              style={{ color: "var(--muted)" }}
              title="Delete location"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={onToggleVisited}
            disabled={isPending}
            className="rounded-full w-7 h-7 flex items-center justify-center text-sm border transition-all"
            style={{
              borderColor: loc.visited ? "var(--accent)" : "var(--border)",
              backgroundColor: loc.visited ? "var(--accent)" : "transparent",
              color: loc.visited ? "#fff" : "var(--muted)",
            }}
            title={loc.visited ? "Mark as not visited" : "Mark as visited"}
          >
            {loc.visited ? "✓" : ""}
          </button>
        </div>
      </div>

      {/* Visited date */}
      {loc.visited && loc.visited_date && (
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
          Visited {formatDate(loc.visited_date)}
        </p>
      )}

      {/* Rating */}
      <div className="mb-2">
        <StarRating rating={loc.rating} onRate={onRate} disabled={isPending} />
      </div>

      {/* Notes */}
      {editingNotes ? (
        <div className="flex flex-col gap-1">
          <textarea
            className="w-full rounded-lg border px-2 py-1.5 text-xs resize-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
            rows={2}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Add your notes..."
          />
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: "var(--muted)" }}
              onClick={() => {
                setLocalNotes(loc.notes || "");
                setEditingNotes(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ color: "var(--accent)" }}
              disabled={isPending}
              onClick={() => {
                onNotesChange(localNotes);
                setEditingNotes(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="text-xs text-left w-full"
          style={{ color: loc.notes ? "var(--foreground)" : "var(--muted)" }}
          onClick={() => setEditingNotes(true)}
        >
          {loc.notes || "Add notes..."}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Location Modal                                                 */
/* ------------------------------------------------------------------ */

function AddLocationForm({
  onAdd,
  onCancel,
  isPending,
}: {
  onAdd: (data: { name: string; description: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--accent)",
        backgroundColor: "var(--card)",
      }}
    >
      <h3
        className="font-display font-semibold text-sm mb-3"
        style={{ color: "var(--foreground)" }}
      >
        Add New Location
      </h3>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Location name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2 justify-end mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "var(--muted)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || isPending}
            onClick={() => onAdd({ name: name.trim(), description: description.trim() })}
            className="text-sm px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {isPending ? "Adding..." : "Add Location"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ visited, total }: { visited: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((visited / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {visited} of {total} visited
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                              */
/* ------------------------------------------------------------------ */

export function AdventureClient({
  config,
  savedLocations,
}: {
  config: AdventureConfig;
  savedLocations: AdventureLocation[];
}) {
  const { activeFamilyId } = useFamily();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("name");
  const [showAddForm, setShowAddForm] = useState(false);

  const merged = useMemo(
    () => mergeLocations(config.presetLocations, savedLocations),
    [config.presetLocations, savedLocations],
  );

  const visitedCount = merged.filter((l) => l.visited).length;

  // Filter
  const filtered = useMemo(() => {
    let list = merged;
    if (filter === "visited") list = list.filter((l) => l.visited);
    if (filter === "not-visited") list = list.filter((l) => !l.visited);
    return list;
  }, [merged, filter]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) => {
        if (a.visited_date && b.visited_date)
          return b.visited_date.localeCompare(a.visited_date);
        if (a.visited_date) return -1;
        if (b.visited_date) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return copy;
  }, [filtered, sort]);

  const handleToggleVisited = useCallback(
    (loc: MergedLocation) => {
      startTransition(async () => {
        await toggleVisited(
          config.featureSlug,
          loc.name,
          !loc.visited,
          loc.latitude,
          loc.longitude,
          loc.description,
        );
      });
    },
    [config.featureSlug],
  );

  const handleRate = useCallback(
    (loc: MergedLocation, rating: number) => {
      startTransition(async () => {
        await updateRating(
          config.featureSlug,
          loc.name,
          rating,
          loc.latitude,
          loc.longitude,
          loc.description,
        );
      });
    },
    [config.featureSlug],
  );

  const handleNotesChange = useCallback(
    (loc: MergedLocation, notes: string) => {
      startTransition(async () => {
        await updateNotes(
          config.featureSlug,
          loc.name,
          notes,
          loc.latitude,
          loc.longitude,
          loc.description,
        );
      });
    },
    [config.featureSlug],
  );

  const handleAddLocation = useCallback(
    (data: { name: string; description: string }) => {
      startTransition(async () => {
        await addCustomLocation(config.featureSlug, data);
        setShowAddForm(false);
      });
    },
    [config.featureSlug],
  );

  const handleDelete = useCallback(
    (loc: MergedLocation) => {
      if (!loc.id) return;
      startTransition(async () => {
        await deleteLocation(config.featureSlug, loc.id!);
      });
    },
    [config.featureSlug],
  );

  const icon = ICONS[config.icon] || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/dashboard/tools"
        className="text-sm mb-4 inline-block hover:underline"
        style={{ color: "var(--muted)" }}
      >
        &larr; Back to Plan
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-display text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <span className="text-2xl">{icon}</span>
          {config.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {config.subtitle}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar visited={visitedCount} total={merged.length} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Filter */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {(
            [
              ["all", "All"],
              ["visited", "Visited"],
              ["not-visited", "Not Yet"],
            ] as [FilterMode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className="text-xs px-3 py-1.5 transition-colors"
              style={{
                backgroundColor:
                  filter === value ? "var(--accent)" : "transparent",
                color: filter === value ? "#fff" : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="text-xs rounded-lg border px-2 py-1.5"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
        >
          <option value="name">Sort by name</option>
          <option value="visited-date">Sort by visited date</option>
        </select>

        {/* Add button */}
        {config.allowCustomLocations && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            + Add Location
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-5">
          <AddLocationForm
            onAdd={handleAddLocation}
            onCancel={() => setShowAddForm(false)}
            isPending={isPending}
          />
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div
          className="text-center py-12 rounded-xl border"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <p
            className="text-3xl mb-2"
            role="img"
            aria-label={config.icon}
          >
            {icon}
          </p>
          <p
            className="font-display font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {config.presetLocations.length > 0
              ? "No locations match your filter"
              : "No locations yet"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {config.allowCustomLocations
              ? "Add your first location to get started"
              : "Toggle the filter to see all locations"}
          </p>
        </div>
      )}

      {/* Location grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((loc) => (
          <LocationCard
            key={loc.name}
            loc={loc}
            config={config}
            isPending={isPending}
            onToggleVisited={() => handleToggleVisited(loc)}
            onRate={(r) => handleRate(loc, r)}
            onNotesChange={(notes) => handleNotesChange(loc, notes)}
            onDelete={loc.isCustom ? () => handleDelete(loc) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
