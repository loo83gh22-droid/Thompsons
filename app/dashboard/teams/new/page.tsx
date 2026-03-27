"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { createTeam, registerTeamPhoto, setTeamCoverPhoto } from "../actions";
import PhotoUpload from "@/app/components/PhotoUpload";
import { compressImages } from "@/src/lib/compressImage";

type FamilyMember = { id: string; name: string; nickname: string | null; color: string | null };
type MemberRole = "Player" | "Coach" | "Manager" | "Supporter";
type TeamMemberInput = { memberId: string; role: MemberRole };

const SEASONS = ["Spring", "Summer", "Fall", "Winter", "Year-round"] as const;
const ROLES: MemberRole[] = ["Player", "Coach", "Manager", "Supporter"];
const SPORT_SUGGESTIONS = [
  "Baseball", "Basketball", "Dance", "Football", "Hockey", "Lacrosse",
  "Soccer", "Softball", "Swimming", "Tennis", "Track & Field", "Volleyball",
  "Wrestling", "Gymnastics", "Cheerleading", "Cross Country", "Curling",
  "Rowing", "Rugby", "Skiing", "Skating", "Snowboard", "Water Polo",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function NewTeamPage() {
  const router = useRouter();
  const { activeFamilyId, currentMemberId } = useFamily();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sportOrActivity, setSportOrActivity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [season, setSeason] = useState<string>("");
  const [year, setYear] = useState<string>(String(currentYear));
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  useEffect(() => {
    if (!activeFamilyId) return;
    const supabase = createClient();
    supabase
      .from("family_members")
      .select("id, name, nickname, color")
      .eq("family_id", activeFamilyId)
      .eq("is_remembered", false)
      .order("name")
      .then(({ data }) => {
        if (data) setMembers(data as FamilyMember[]);
      });
  }, [activeFamilyId]);

  // Pre-select current user
  useEffect(() => {
    if (currentMemberId && teamMembers.length === 0) {
      setTeamMembers([{ memberId: currentMemberId, role: "Player" }]);
    }
  }, [currentMemberId, teamMembers.length]);

  const handlePhotoChange = useCallback((files: File[], coverIndex: number) => {
    setPhotoFiles(files);
    setCoverPhotoIndex(coverIndex);
  }, []);

  function toggleMember(memberId: string) {
    setTeamMembers((prev) => {
      const exists = prev.find((m) => m.memberId === memberId);
      if (exists) return prev.filter((m) => m.memberId !== memberId);
      return [...prev, { memberId, role: "Player" }];
    });
  }

  function setMemberRole(memberId: string, role: MemberRole) {
    setTeamMembers((prev) =>
      prev.map((m) => (m.memberId === memberId ? { ...m, role } : m))
    );
  }

  const filteredSuggestions = SPORT_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(sportOrActivity.toLowerCase()) && s.toLowerCase() !== sportOrActivity.toLowerCase()
  ).slice(0, 6);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Team name is required."); return; }
    if (!sportOrActivity.trim()) { setError("Sport or activity is required."); return; }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Compress + upload photos client-side first
      const orderedPhotos =
        photoFiles.length === 0
          ? []
          : coverPhotoIndex === 0
            ? photoFiles
            : [photoFiles[coverPhotoIndex], ...photoFiles.slice(0, coverPhotoIndex), ...photoFiles.slice(coverPhotoIndex + 1)];

      const compressedPhotos = orderedPhotos.length > 0
        ? (setUploadProgress("Compressing photos…"), await compressImages(orderedPhotos))
        : [];

      const tempId = crypto.randomUUID();
      let uploadedCount = 0;
      const photoUploads = compressedPhotos.map(async (file) => {
        const ext = file.name.split(".").pop() || "jpg";
        const storagePath = `${tempId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("team-photos")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) { console.error("Photo upload failed:", uploadError.message); return null; }
        uploadedCount++;
        setUploadProgress(`Uploading photos… ${uploadedCount}/${compressedPhotos.length}`);
        return { storagePath, fileSize: file.size };
      });
      const photoResults = (await Promise.all(photoUploads)).filter(
        (r): r is { storagePath: string; fileSize: number } => r !== null
      );

      // Build FormData for server action
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("sport_or_activity", sportOrActivity.trim());
      if (season) formData.set("season", season);
      if (year) formData.set("year", year);
      if (city.trim()) formData.set("city", city.trim());
      if (description.trim()) formData.set("description", description.trim());
      formData.set("team_members", JSON.stringify(teamMembers));

      setUploadProgress("Saving team…");
      const result = await createTeam(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Register photos
      if (photoResults.length > 0) {
        setUploadProgress(`Saving photos… 0/${photoResults.length}`);
        const registeredIds: string[] = [];
        for (let i = 0; i < photoResults.length; i++) {
          const meta = photoResults[i];
          // Move from tempId path to teamId path in storage
          const newPath = `${result.id}/${crypto.randomUUID()}.${meta.storagePath.split(".").pop() || "jpg"}`;
          const { data: fileData } = await supabase.storage.from("team-photos").download(meta.storagePath);
          if (fileData) {
            await supabase.storage.from("team-photos").upload(newPath, fileData, { upsert: true });
            await supabase.storage.from("team-photos").remove([meta.storagePath]);
            const photoId = await registerTeamPhoto(result.id, newPath, meta.fileSize);
            if (photoId) registeredIds.push(photoId);
          }
          setUploadProgress(`Saving photos… ${i + 1}/${photoResults.length}`);
        }
        if (registeredIds.length > 0) {
          await setTeamCoverPhoto(result.id, registeredIds[0]);
        }
      }

      setUploadProgress(null);
      router.push(`/dashboard/teams/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/teams" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Back to teams
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
        Add a team
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        A season, a club, a league — anything your family played, coached, or cheered for.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Team name */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Team name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Oakville Blue Jays, Rep Soccer U12"
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            required
          />
        </div>

        {/* Sport / activity */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Sport or activity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={sportOrActivity}
            onChange={(e) => { setSportOrActivity(e.target.value); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g. Baseball, Soccer, Dance, Swimming"
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            required
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => { setSportOrActivity(s); setShowSuggestions(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Season + Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">— Any —</option>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">— Any —</option>
              {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            City / Town <span className="text-xs font-normal text-[var(--muted)]">— adds a pin to the Family Map</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Oakville, ON"
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Who's on the team */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Who&apos;s on the team?
          </label>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Select members and assign their role.</p>
          <div className="mt-3 space-y-2">
            {members.map((member) => {
              const assignment = teamMembers.find((m) => m.memberId === member.id);
              const isSelected = !!assignment;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: member.color ?? "#6b7280" }}
                    >
                      {(member.nickname ?? member.name).charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm text-[var(--foreground)]">
                      {member.nickname ?? member.name}
                    </span>
                    {!isSelected && (
                      <span className="ml-auto text-xs text-[var(--muted)]">Add</span>
                    )}
                  </button>
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setMemberRole(member.id, role)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                            assignment.role === role
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)]"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className="ml-1 text-xs text-[var(--muted)] hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Write-up <span className="text-xs font-normal text-[var(--muted)]">— optional</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How did the season go? Any memorable games, moments, or highlights?"
            rows={5}
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Photos <span className="text-xs font-normal text-[var(--muted)]">— up to 20, first photo is the cover</span>
          </label>
          <div className="mt-1.5">
            <PhotoUpload
              onChange={handlePhotoChange}
              maxFiles={20}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploadProgress ?? (loading ? "Saving…" : "Save team")}
          </button>
          <Link
            href="/dashboard/teams"
            className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
