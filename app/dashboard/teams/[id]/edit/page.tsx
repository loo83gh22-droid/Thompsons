"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useFamily } from "@/app/dashboard/FamilyContext";
import { updateTeam, registerTeamPhoto, setTeamCoverPhoto, deleteTeamPhoto } from "../../actions";
import PhotoUpload from "@/app/components/PhotoUpload";
import { compressImages } from "@/src/lib/compressImage";

type FamilyMember = { id: string; name: string; nickname: string | null; color: string | null };
type MemberRole = "Player" | "Coach" | "Manager" | "Supporter";
type TeamMemberInput = { memberId: string; role: MemberRole };
type ExistingPhoto = { id: string; url: string; caption: string | null; sort_order: number };

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

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const { activeFamilyId } = useFamily();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [name, setName] = useState("");
  const [sportOrActivity, setSportOrActivity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [season, setSeason] = useState("");
  const [year, setYear] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  // Load team data
  useEffect(() => {
    if (!activeFamilyId || !teamId) return;
    const supabase = createClient();

    Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).eq("family_id", activeFamilyId).single(),
      supabase.from("team_photos").select("id, url, caption, sort_order").eq("team_id", teamId).order("sort_order"),
      supabase.from("team_members").select("family_member_id, role").eq("team_id", teamId),
      supabase.from("family_members").select("id, name, nickname, color").eq("family_id", activeFamilyId).eq("is_remembered", false).order("name"),
    ]).then(([teamRes, photosRes, membersRes, allMembersRes]) => {
      if (teamRes.data) {
        setName(teamRes.data.name ?? "");
        setSportOrActivity(teamRes.data.sport_or_activity ?? "");
        setSeason(teamRes.data.season ?? "");
        setYear(teamRes.data.year ? String(teamRes.data.year) : "");
        setCity(teamRes.data.city ?? "");
        setDescription(teamRes.data.description ?? "");
      }
      if (photosRes.data) setExistingPhotos(photosRes.data as ExistingPhoto[]);
      if (membersRes.data) {
        setTeamMembers(
          membersRes.data.map((m) => ({
            memberId: m.family_member_id,
            role: (m.role as MemberRole) ?? "Player",
          }))
        );
      }
      if (allMembersRes.data) setMembers(allMembersRes.data as FamilyMember[]);
      setDataLoaded(true);
    });
  }, [activeFamilyId, teamId]);

  const handlePhotoChange = useCallback((files: File[], coverIndex: number) => {
    setNewPhotoFiles(files);
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

  async function handleRemovePhoto(photoId: string) {
    const result = await deleteTeamPhoto(photoId, teamId);
    if (result.success) {
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
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

      // Upload new photos
      const orderedPhotos =
        newPhotoFiles.length === 0
          ? []
          : coverPhotoIndex === 0
            ? newPhotoFiles
            : [newPhotoFiles[coverPhotoIndex], ...newPhotoFiles.slice(0, coverPhotoIndex), ...newPhotoFiles.slice(coverPhotoIndex + 1)];

      const compressedPhotos = orderedPhotos.length > 0
        ? (setUploadProgress("Compressing photos…"), await compressImages(orderedPhotos))
        : [];

      let uploadedCount = 0;
      const photoUploads = compressedPhotos.map(async (file) => {
        const ext = file.name.split(".").pop() || "jpg";
        const storagePath = `${teamId}/${crypto.randomUUID()}.${ext}`;
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

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("sport_or_activity", sportOrActivity.trim());
      if (season) formData.set("season", season);
      if (year) formData.set("year", year);
      if (city.trim()) formData.set("city", city.trim());
      if (description.trim()) formData.set("description", description.trim());
      formData.set("team_members", JSON.stringify(teamMembers));

      setUploadProgress("Saving…");
      const result = await updateTeam(teamId, formData);

      if (!result.success) { setError(result.error); return; }

      // Register new photos
      if (photoResults.length > 0) {
        setUploadProgress(`Saving photos… 0/${photoResults.length}`);
        const registeredIds: string[] = [];
        for (let i = 0; i < photoResults.length; i++) {
          const meta = photoResults[i];
          const photoId = await registerTeamPhoto(result.id, meta.storagePath, meta.fileSize);
          if (photoId) registeredIds.push(photoId);
          setUploadProgress(`Saving photos… ${i + 1}/${photoResults.length}`);
        }
        // If no existing photos, set new first photo as cover
        if (existingPhotos.length === 0 && registeredIds.length > 0) {
          await setTeamCoverPhoto(result.id, registeredIds[0]);
        }
      }

      setUploadProgress(null);
      router.push(`/dashboard/teams/${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  if (!dataLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/dashboard/teams/${teamId}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Back to team
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
        Edit team
      </h1>

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
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
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
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
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
            City / Town <span className="text-xs font-normal text-[var(--muted)]">— pins to Family Map</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Who's on the team */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Who&apos;s on the team?</label>
          <div className="mt-3 space-y-2">
            {members.map((member) => {
              const assignment = teamMembers.find((m) => m.memberId === member.id);
              const isSelected = !!assignment;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    isSelected ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface)]"
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
                    {!isSelected && <span className="ml-auto text-xs text-[var(--muted)]">Add</span>}
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
          <label className="block text-sm font-medium text-[var(--foreground)]">Write-up</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {/* Existing photos */}
        {existingPhotos.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Current photos
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-[var(--surface)]">
                  <Image
                    src={photo.url}
                    alt="Team photo"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add more photos */}
        {existingPhotos.length < 20 && (
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Add more photos{" "}
              <span className="text-xs font-normal text-[var(--muted)]">
                ({20 - existingPhotos.length} remaining)
              </span>
            </label>
            <div className="mt-1.5">
              <PhotoUpload
                onChange={handlePhotoChange}
                maxFiles={20 - existingPhotos.length}
              />
            </div>
          </div>
        )}

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
            {uploadProgress ?? (loading ? "Saving…" : "Save changes")}
          </button>
          <Link
            href={`/dashboard/teams/${teamId}`}
            className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
