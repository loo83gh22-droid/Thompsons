"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerGardenPhoto, setGardenCoverPhoto, deleteGardenPhoto, deleteGardenEntry } from "../actions";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { compressImage } from "@/src/lib/compressImage";

type Photo = { id: string; src: string; storagePath: string };

type Props = {
  entryId: string;
  photos: Photo[];
  coverPath: string | null;
  myRole: string;
};

export function GardenDetailClient({ entryId, photos: initial, coverPath: initialCover, myRole }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [coverPath, setCoverPath] = useState(initialCover);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit = myRole === "owner" || myRole === "adult";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of files) {
        const compressed = await compressImage(file, { maxWidthOrHeight: 2000 });
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${entryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("garden-photos").upload(path, compressed);
        if (error) continue;
        const photoId = await registerGardenPhoto(entryId, path, compressed.size);
        if (photoId) {
          setPhotos(prev => [...prev, { id: photoId, src: `/api/storage/garden-photos/${path}`, storagePath: path }]);
          if (!coverPath) {
            await setGardenCoverPhoto(entryId, path);
            setCoverPath(path);
          }
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSetCover(storagePath: string) {
    startTransition(async () => {
      const res = await setGardenCoverPhoto(entryId, storagePath);
      if (res.success) setCoverPath(storagePath);
    });
  }

  function handleDeletePhoto(photoId: string) {
    toast("Remove this photo? This cannot be undone.", {
      action: {
        label: "Remove",
        onClick: () => {
          startTransition(async () => {
            const res = await deleteGardenPhoto(photoId, entryId);
            if (res.success) setPhotos(prev => prev.filter(p => p.id !== photoId));
          });
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 8000,
    });
  }

  function handleDeleteEntry() {
    if (!confirm("Delete this season? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteGardenEntry(entryId);
      if (res.success) router.push("/dashboard/garden");
    });
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Photos</h2>
        {canEdit && photos.length < 20 && (
          <label className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
            {uploading ? "Uploading…" : "+ Add photos"}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No photos yet.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(photo => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--surface)]">
            <Image src={photo.src} alt="Garden photo" fill className="object-cover" />
            {photo.storagePath === coverPath && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-900">Cover</span>
            )}
            {canEdit && (
              <div className="absolute inset-0 flex flex-col items-end justify-end gap-1 bg-black/30 p-2 opacity-0 transition group-hover:opacity-100">
                {photo.storagePath !== coverPath && (
                  <button onClick={() => handleSetCover(photo.storagePath)} disabled={isPending} className="rounded-lg bg-yellow-400 px-2 py-1 text-xs font-semibold text-yellow-900">
                    Set cover
                  </button>
                )}
                <button onClick={() => handleDeletePhoto(photo.id)} disabled={isPending} className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="mt-12 border-t border-[var(--border)] pt-6">
          <button onClick={handleDeleteEntry} disabled={isPending} className="text-sm text-red-500 hover:underline disabled:opacity-50">
            Delete this season
          </button>
        </div>
      )}
    </div>
  );
}
