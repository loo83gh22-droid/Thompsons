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
import { X, Star, Upload } from "lucide-react";

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  isCover: boolean;
}

interface PhotoUploadProps {
  onChange: (files: File[], coverIndex: number) => void;
  maxFiles?: number;
}

function SortablePhoto({
  photo,
  onRemove,
  onSetCover,
}: {
  photo: PhotoFile;
  onRemove: () => void;
  onSetCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: photo.id,
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
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview, next/image not used */}
      <img
        src={photo.preview}
        alt="Upload preview"
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {photo.isCover && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-medium text-[var(--background)]">
          <Star className="h-3 w-3 fill-current" />
          Cover
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/50 group-hover:opacity-100 opacity-0">
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
            className={`h-4 w-4 ${photo.isCover ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--foreground)]"}`}
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full bg-red-600 p-2 hover:bg-red-500 transition-colors"
          title="Remove photo"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

export default function PhotoUpload({
  onChange,
  maxFiles = 20,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPhotos: PhotoFile[] = acceptedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        isCover: photos.length === 0 && index === 0,
      }));

      const updatedPhotos = [...photos, ...newPhotos].slice(0, maxFiles);
      setPhotos(updatedPhotos);

      const coverIndex = updatedPhotos.findIndex((p) => p.isCover);
      onChange(
        updatedPhotos.map((p) => p.file),
        coverIndex >= 0 ? coverIndex : 0
      );
    },
    [photos, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: maxFiles - photos.length,
  });

  const removePhoto = (id: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== id);
    if (updatedPhotos.length > 0 && !updatedPhotos.some((p) => p.isCover)) {
      updatedPhotos[0].isCover = true;
    }
    setPhotos(updatedPhotos);
    const coverIndex = updatedPhotos.findIndex((p) => p.isCover);
    onChange(
      updatedPhotos.map((p) => p.file),
      coverIndex >= 0 ? coverIndex : 0
    );
  };

  const setCoverPhoto = (id: string) => {
    const updatedPhotos = photos.map((p) => ({ ...p, isCover: p.id === id }));
    setPhotos(updatedPhotos);
    const coverIndex = updatedPhotos.findIndex((p) => p.isCover);
    onChange(
      updatedPhotos.map((p) => p.file),
      coverIndex >= 0 ? coverIndex : 0
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const updatedPhotos = arrayMove(photos, oldIndex, newIndex);
      setPhotos(updatedPhotos);
      const coverIndex = updatedPhotos.findIndex((p) => p.isCover);
      onChange(
        updatedPhotos.map((p) => p.file),
        coverIndex >= 0 ? coverIndex : 0
      );
    }
  };

  const totalSize = photos.reduce((sum, p) => sum + p.file.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[var(--muted)]">Photos</label>
      {photos.length < maxFiles && (
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
            <p className="text-[var(--foreground)]">Drop photos here...</p>
          ) : (
            <div>
              <p className="text-[var(--foreground)] mb-1">
                Drag photos here or click to browse
              </p>
              <p className="text-sm text-[var(--muted)]">
                You can select multiple images at once
              </p>
            </div>
          )}
        </div>
      )}
      {photos.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}, {totalSizeMB} MB
            </p>
            <p className="text-xs text-[var(--muted)]">
              Drag to reorder • Click star to set cover
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    onRemove={() => removePhoto(photo.id)}
                    onSetCover={() => setCoverPhoto(photo.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
