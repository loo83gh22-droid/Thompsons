"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Star, Upload, Film, AlertCircle } from "lucide-react";
import { VIDEO_LIMITS, PHOTO_LIMITS } from "@/src/lib/constants";

/* ── Types ─────────────────────────────────────────────────── */

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  isCover: boolean;
  type: "photo" | "video";
  durationSeconds?: number;
}

interface PhotoUploadProps {
  onChange: (files: File[], coverIndex: number) => void;
  onVideoChange?: (files: File[]) => void;
  maxFiles?: number;
  maxVideos?: number;
  allowVideos?: boolean;
}

/* ── Helpers ───────────────────────────────────────────────── */

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video"));
    };
    video.src = URL.createObjectURL(file);
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Sortable thumbnail ────────────────────────────────────── */

function SortableMedia({
  media,
  onRemove,
  onSetCover,
}: {
  media: MediaFile;
  onRemove: () => void;
  onSetCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: media.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-square cursor-move overflow-hidden rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] transition-all hover:border-[var(--muted)]"
    >
      {media.type === "video" ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- preview thumbnail only */}
          <video
            src={media.preview}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
            <Film className="h-3 w-3" />
            {media.durationSeconds ? formatDuration(media.durationSeconds) : "Video"}
          </div>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, next/image not used */}
          <img
            src={media.preview}
            alt="Upload preview"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </>
      )}

      {media.isCover && media.type === "photo" && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-medium text-[var(--background)]">
          <Star className="h-3 w-3 fill-current" />
          Cover
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/50 group-hover:opacity-100 opacity-0">
        {media.type === "photo" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetCover();
            }}
            className="rounded-full bg-[var(--surface)] p-2 hover:bg-[var(--surface-hover)] transition-colors"
            title="Set as cover photo"
          >
            <Star
              className={`h-4 w-4 ${media.isCover ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--foreground)]"}`}
            />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full bg-red-600 p-2 hover:bg-red-500 transition-colors"
          title="Remove"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function PhotoUpload({
  onChange,
  onVideoChange,
  maxFiles = PHOTO_LIMITS.maxPhotosPerEntry,
  maxVideos = VIDEO_LIMITS.maxVideosPerJournalEntry,
  allowVideos = false,
}: PhotoUploadProps) {
  const [items, setItems] = useState<MediaFile[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);

  const photos = items.filter((i) => i.type === "photo");
  const videos = items.filter((i) => i.type === "video");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Notify parent whenever items change
  const notifyParent = useCallback(
    (updated: MediaFile[]) => {
      const photoItems = updated.filter((i) => i.type === "photo");
      const videoItems = updated.filter((i) => i.type === "video");
      const coverIndex = photoItems.findIndex((p) => p.isCover);
      onChange(
        photoItems.map((p) => p.file),
        coverIndex >= 0 ? coverIndex : 0
      );
      if (onVideoChange) {
        onVideoChange(videoItems.map((v) => v.file));
      }
    },
    [onChange, onVideoChange]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setVideoError(null);
      const newItems: MediaFile[] = [];

      let currentPhotos = photos.length;
      let currentVideos = videos.length;

      for (const file of acceptedFiles) {
        if (isVideoFile(file)) {
          if (!allowVideos) continue;
          if (currentVideos >= maxVideos) {
            setVideoError(`Maximum ${maxVideos} videos per entry.`);
            continue;
          }
          if (file.size > VIDEO_LIMITS.maxSizeBytes) {
            setVideoError(
              `"${file.name}" is ${formatSize(file.size)} — max ${VIDEO_LIMITS.maxSizeMB} MB per video.`
            );
            continue;
          }
          // Check duration
          try {
            const duration = await getVideoDuration(file);
            if (duration > VIDEO_LIMITS.maxDurationSeconds) {
              setVideoError(
                `"${file.name}" is ${formatDuration(duration)} — max 5 minutes per video.`
              );
              continue;
            }
            newItems.push({
              id: `${Date.now()}-v-${currentVideos}`,
              file,
              preview: URL.createObjectURL(file),
              isCover: false,
              type: "video",
              durationSeconds: Math.round(duration),
            });
            currentVideos++;
          } catch {
            setVideoError(`Could not read "${file.name}". Try a different video format.`);
          }
        } else {
          if (currentPhotos >= maxFiles) continue;
          newItems.push({
            id: `${Date.now()}-p-${currentPhotos}`,
            file,
            preview: URL.createObjectURL(file),
            isCover: currentPhotos === 0 && photos.length === 0,
            type: "photo",
          });
          currentPhotos++;
        }
      }

      const updated = [...items, ...newItems];
      // Ensure at least one cover photo
      const photoItems = updated.filter((i) => i.type === "photo");
      if (photoItems.length > 0 && !photoItems.some((p) => p.isCover)) {
        photoItems[0].isCover = true;
      }
      setItems(updated);
      notifyParent(updated);
    },
    [items, photos.length, videos.length, maxFiles, maxVideos, allowVideos, notifyParent]
  );

  const acceptTypes: Record<string, string[]> = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  };
  if (allowVideos) {
    acceptTypes["video/*"] = [".mp4", ".mov", ".webm"];
  }

  const canAddMore = photos.length < maxFiles || (allowVideos && videos.length < maxVideos);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxFiles: (maxFiles - photos.length) + (allowVideos ? maxVideos - videos.length : 0),
  });

  const removeItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    // Reassign cover if needed
    const photoItems = updated.filter((i) => i.type === "photo");
    if (photoItems.length > 0 && !photoItems.some((p) => p.isCover)) {
      photoItems[0].isCover = true;
    }
    setItems(updated);
    setVideoError(null);
    notifyParent(updated);
  };

  const setCoverPhoto = (id: string) => {
    const updated = items.map((i) => ({
      ...i,
      isCover: i.type === "photo" && i.id === id,
    }));
    setItems(updated);
    notifyParent(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const updated = arrayMove(items, oldIndex, newIndex);
      setItems(updated);
      notifyParent(updated);
    }
  };

  const totalSize = items.reduce((sum, i) => sum + i.file.size, 0);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[var(--muted)]">
        {allowVideos ? "Photos & Videos" : "Photos"}
      </label>

      {canAddMore && (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] hover:border-[var(--muted)]"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
          {isDragActive ? (
            <p className="text-[var(--foreground)]">Drop files here...</p>
          ) : (
            <div>
              <p className="text-[var(--foreground)] mb-1">
                {allowVideos
                  ? "Drag photos or videos here, or click to browse"
                  : "Drag photos here or click to browse"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {allowVideos
                  ? "Keep the gems, not everything — the moments that matter most"
                  : "You can select multiple images at once"}
              </p>
            </div>
          )}
        </div>
      )}

      {videoError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {videoError}
        </div>
      )}

      {items.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              {photos.length > 0 && (
                <span>
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>
              )}
              {photos.length > 0 && videos.length > 0 && <span>, </span>}
              {videos.length > 0 && (
                <span>
                  {videos.length} {videos.length === 1 ? "video" : "videos"}
                </span>
              )}
              <span className="ml-1 text-[var(--muted)]">({formatSize(totalSize)})</span>
            </p>
            <p className="text-xs text-[var(--muted)]">
              Drag to reorder{photos.length > 0 ? " • Click star to set cover" : ""}
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {items.map((item) => (
                  <SortableMedia
                    key={item.id}
                    media={item}
                    onRemove={() => removeItem(item.id)}
                    onSetCover={() => setCoverPhoto(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {allowVideos && (
        <p className="text-xs text-[var(--muted)]">
          Up to {maxFiles} photos and {maxVideos} videos per entry (5 min, {VIDEO_LIMITS.maxSizeMB} MB each).
        </p>
      )}
    </div>
  );
}
