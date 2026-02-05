import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhotosManager } from "./PhotosManager";

export default async function PhotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: photos } = await supabase
    .from("home_mosaic_photos")
    .select("id, url, sort_order")
    .order("sort_order");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Photos
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Upload photos here. They make up the background mosaic on every page.
      </p>

      <PhotosManager initialPhotos={photos || []} />
    </div>
  );
}
