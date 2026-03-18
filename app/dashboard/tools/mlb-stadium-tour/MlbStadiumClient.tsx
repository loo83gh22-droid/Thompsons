"use client";

import { useState, useTransition, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { MLB_TEAMS, type MlbTeam, type MlbStadium } from "../adventure/presets";
import type { AdventureLocation, AdventureVisit, AdventurePhoto } from "../adventure/actions";
import {
  addVisit,
  deleteVisit,
  uploadLocationPhoto,
  deleteLocationPhoto,
  updateRating,
  updateNotes,
} from "../adventure/actions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FamilyMember = { id: string; name: string; color?: string | null };

type FilterMode = "all" | "visited" | "not-visited";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPhotoUrl(storagePath: string) {
  return `/api/storage/adventure-locations/${storagePath}`;
}

/** Count teams with at least one visit to any of their stadiums */
function countVisitedTeams(
  visits: AdventureVisit[],
  locations: AdventureLocation[],
) {
  const visitedLocationIds = new Set(visits.map((v) => v.location_id));
  const visitedLocationNames = new Set(
    locations.filter((l) => visitedLocationIds.has(l.id)).map((l) => l.name),
  );

  return MLB_TEAMS.filter((team) =>
    team.stadiums.some((s) => visitedLocationNames.has(s.name)),
  ).length;
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ visited, total }: { visited: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((visited / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {visited} of {total} teams visited
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Visit Form                                                     */
/* ------------------------------------------------------------------ */

function AddVisitForm({
  stadium,
  members,
  isPending,
  onAdd,
  onCancel,
}: {
  stadium: MlbStadium;
  members: FamilyMember[];
  isPending: boolean;
  onAdd: (memberIds: string[], date: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  return (
    <div
      className="rounded-lg border p-3 mt-2"
      style={{ borderColor: "var(--accent)", backgroundColor: "var(--card)" }}
    >
      <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>
        Log a visit to {stadium.name}
      </h4>

      {/* Member selection */}
      <div className="mb-2">
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>
          Who went?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5"
              style={{
                borderColor: selectedMembers.includes(m.id) ? "var(--accent)" : "var(--border)",
                backgroundColor: selectedMembers.includes(m.id) ? "var(--accent)" : "transparent",
                color: selectedMembers.includes(m.id) ? "#fff" : "var(--foreground)",
              }}
            >
              {m.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedMembers.includes(m.id) ? "#fff" : m.color }}
                />
              )}
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="mb-2">
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-xs rounded-lg border px-2 py-1.5 w-full"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Notes */}
      <div className="mb-2">
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted)" }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Great seats behind home plate..."
          rows={2}
          className="text-xs rounded-lg border px-2 py-1.5 w-full resize-none"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ color: "var(--muted)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={selectedMembers.length === 0 || isPending}
          onClick={() => onAdd(selectedMembers, date, notes)}
          className="text-xs px-2.5 py-1 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {isPending ? "Saving..." : "Log Visit"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Photo Upload Button                                                */
/* ------------------------------------------------------------------ */

function PhotoUploadButton({
  stadiumName,
  visitId,
  latitude,
  longitude,
  isPending,
  startTransition,
}: {
  stadiumName: string;
  visitId?: string;
  latitude: number;
  longitude: number;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("photo", file);
    startTransition(async () => {
      await uploadLocationPhoto(
        "mlb-stadium-tour",
        stadiumName,
        fd,
        latitude,
        longitude,
        undefined,
        visitId,
      );
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => fileRef.current?.click()}
        className="text-xs px-2 py-0.5 rounded border transition-colors hover:opacity-80"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        title="Upload photo"
      >
        + Photo
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stadium Card                                                       */
/* ------------------------------------------------------------------ */

function StadiumCard({
  stadium,
  location,
  visits,
  photos,
  members,
  memberMap,
  isPending,
  startTransition,
}: {
  stadium: MlbStadium;
  location: AdventureLocation | null;
  visits: AdventureVisit[];
  photos: AdventurePhoto[];
  members: FamilyMember[];
  memberMap: Map<string, FamilyMember>;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasVisits = visits.length > 0;
  const stadiumPhotos = photos.filter(
    (p) => !p.visit_id || visits.some((v) => v.id === p.visit_id),
  );

  const handleAddVisit = (memberIds: string[], date: string, notes: string) => {
    startTransition(async () => {
      await addVisit(
        "mlb-stadium-tour",
        stadium.name,
        memberIds,
        date,
        notes || undefined,
        stadium.latitude,
        stadium.longitude,
        stadium.city,
      );
      setShowAddVisit(false);
    });
  };

  const handleDeleteVisit = (visitId: string) => {
    startTransition(async () => {
      await deleteVisit("mlb-stadium-tour", visitId);
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    startTransition(async () => {
      await deleteLocationPhoto("mlb-stadium-tour", photoId);
    });
  };

  return (
    <div
      className="rounded-xl border p-3 transition-all"
      style={{
        borderColor: hasVisits ? "var(--accent)" : "var(--border)",
        backgroundColor: hasVisits ? "var(--card)" : "var(--surface)",
        opacity: hasVisits ? 1 : 0.7,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className="font-display font-semibold text-sm truncate"
              style={{ color: "var(--foreground)" }}
            >
              {stadium.name}
            </h4>
            {hasVisits && (
              <span
                className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {visits.length}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {stadium.city} &middot; {stadium.years}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <PhotoUploadButton
            stadiumName={stadium.name}
            latitude={stadium.latitude}
            longitude={stadium.longitude}
            isPending={isPending}
            startTransition={startTransition}
          />
          <button
            type="button"
            onClick={() => setShowAddVisit(!showAddVisit)}
            className="text-xs px-2 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            + Visit
          </button>
        </div>
      </div>

      {/* Photo strip */}
      {stadiumPhotos.length > 0 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {stadiumPhotos.map((photo) => (
            <div key={photo.id} className="relative shrink-0 group">
              <Image
                src={getPhotoUrl(photo.storage_path)}
                alt={photo.caption || stadium.name}
                width={80}
                height={60}
                className="rounded-lg object-cover w-20 h-15"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={isPending}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ backgroundColor: "rgb(220 38 38)" }}
                title="Delete photo"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Visit list (collapsed/expanded) */}
      {hasVisits && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs w-full text-left flex items-center gap-1"
            style={{ color: "var(--muted)" }}
          >
            <span className="text-[10px]">{expanded ? "\u25BC" : "\u25B6"}</span>
            {visits.length} visit{visits.length !== 1 ? "s" : ""}
            {" \u2014 "}
            {/* Show unique member names */}
            {Array.from(new Set(visits.map((v) => memberMap.get(v.member_id)?.name || "?"))).join(", ")}
          </button>

          {expanded && (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {visits.map((visit) => {
                const member = memberMap.get(visit.member_id);
                return (
                  <div
                    key={visit.id}
                    className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5"
                    style={{ backgroundColor: "var(--surface)" }}
                  >
                    {member?.color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: member.color }}
                      />
                    )}
                    <span style={{ color: "var(--foreground)" }} className="font-medium">
                      {member?.name || "Unknown"}
                    </span>
                    {visit.visited_date && (
                      <span style={{ color: "var(--muted)" }}>
                        {formatDate(visit.visited_date)}
                      </span>
                    )}
                    {visit.notes && (
                      <span style={{ color: "var(--muted)" }} className="truncate flex-1">
                        {visit.notes}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="ml-auto shrink-0 text-[10px] px-1 rounded hover:text-red-600 transition-colors"
                      style={{ color: "var(--muted)" }}
                      title="Remove visit"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add visit form */}
      {showAddVisit && (
        <AddVisitForm
          stadium={stadium}
          members={members}
          isPending={isPending}
          onAdd={handleAddVisit}
          onCancel={() => setShowAddVisit(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team Accordion                                                     */
/* ------------------------------------------------------------------ */

function TeamSection({
  team,
  locations,
  visits,
  photos,
  members,
  memberMap,
  isPending,
  startTransition,
  filter,
}: {
  team: MlbTeam;
  locations: AdventureLocation[];
  visits: AdventureVisit[];
  photos: AdventurePhoto[];
  members: FamilyMember[];
  memberMap: Map<string, FamilyMember>;
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  filter: FilterMode;
}) {
  const [open, setOpen] = useState(false);

  // Map location names to their DB rows
  const locByName = useMemo(() => {
    const m = new Map<string, AdventureLocation>();
    for (const l of locations) m.set(l.name, l);
    return m;
  }, [locations]);

  // Map location IDs to visits
  const visitsByLocId = useMemo(() => {
    const m = new Map<string, AdventureVisit[]>();
    for (const v of visits) {
      const arr = m.get(v.location_id) || [];
      arr.push(v);
      m.set(v.location_id, arr);
    }
    return m;
  }, [visits]);

  // Map location IDs to photos
  const photosByLocId = useMemo(() => {
    const m = new Map<string, AdventurePhoto[]>();
    for (const p of photos) {
      const arr = m.get(p.location_id) || [];
      arr.push(p);
      m.set(p.location_id, arr);
    }
    return m;
  }, [photos]);

  // Filter stadiums
  const filteredStadiums = useMemo(() => {
    return team.stadiums.filter((s) => {
      const loc = locByName.get(s.name);
      const locVisits = loc ? (visitsByLocId.get(loc.id) || []) : [];
      const hasVisits = locVisits.length > 0;
      if (filter === "visited") return hasVisits;
      if (filter === "not-visited") return !hasVisits;
      return true;
    });
  }, [team.stadiums, locByName, visitsByLocId, filter]);

  // Count visited stadiums for this team
  const visitedCount = team.stadiums.filter((s) => {
    const loc = locByName.get(s.name);
    return loc && (visitsByLocId.get(loc.id) || []).length > 0;
  }).length;

  if (filteredStadiums.length === 0) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: visitedCount > 0 ? "var(--card)" : "var(--surface)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{"\u26BE"}</span>
          <span
            className="font-display font-semibold text-sm truncate"
            style={{ color: "var(--foreground)" }}
          >
            {team.team}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: visitedCount > 0 ? "var(--accent)" : "var(--border)",
              color: visitedCount > 0 ? "#fff" : "var(--muted)",
            }}
          >
            {visitedCount}/{team.stadiums.length}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
          {filteredStadiums.map((stadium) => {
            const loc = locByName.get(stadium.name) || null;
            const locVisits = loc ? (visitsByLocId.get(loc.id) || []) : [];
            const locPhotos = loc ? (photosByLocId.get(loc.id) || []) : [];

            return (
              <StadiumCard
                key={stadium.name}
                stadium={stadium}
                location={loc}
                visits={locVisits}
                photos={locPhotos}
                members={members}
                memberMap={memberMap}
                isPending={isPending}
                startTransition={startTransition}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                              */
/* ------------------------------------------------------------------ */

export function MlbStadiumClient({
  savedLocations,
  visits,
  photos,
  members,
}: {
  savedLocations: AdventureLocation[];
  visits: AdventureVisit[];
  photos: AdventurePhoto[];
  members: FamilyMember[];
}) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  // Filter visits by member if selected
  const filteredVisits = useMemo(() => {
    if (memberFilter === "all") return visits;
    return visits.filter((v) => v.member_id === memberFilter);
  }, [visits, memberFilter]);

  const totalTeams = MLB_TEAMS.length;
  const visitedTeams = countVisitedTeams(filteredVisits, savedLocations);

  // Group teams by division
  const divisions = useMemo(() => {
    const groups: Record<string, MlbTeam[]> = {};
    for (const t of MLB_TEAMS) {
      const key = `${t.league} ${t.division}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/dashboard/tools"
        className="text-sm mb-4 inline-block hover:underline"
        style={{ color: "var(--muted)" }}
      >
        &larr; Back to Feature Catalog
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-display text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <span className="text-2xl">{"\u26BE"}</span>
          MLB Stadium Tour
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Track every ballpark you visit across the league, past and present
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar visited={visitedTeams} total={totalTeams} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Filter by status */}
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
                backgroundColor: filter === value ? "var(--accent)" : "transparent",
                color: filter === value ? "#fff" : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter by member */}
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="text-xs rounded-lg border px-2 py-1.5"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
        >
          <option value="all">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}&apos;s map</option>
          ))}
        </select>
      </div>

      {/* Teams grouped by division */}
      <div className="flex flex-col gap-6">
        {Object.entries(divisions).map(([division, teams]) => (
          <div key={division}>
            <h2
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--muted)" }}
            >
              {division}
            </h2>
            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <TeamSection
                  key={team.team}
                  team={team}
                  locations={savedLocations}
                  visits={filteredVisits}
                  photos={photos}
                  members={members}
                  memberMap={memberMap}
                  isPending={isPending}
                  startTransition={startTransition}
                  filter={filter}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
