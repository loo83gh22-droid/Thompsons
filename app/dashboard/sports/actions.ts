"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSportsPhoto(
  file: File,
  data?: { title?: string; caption?: string; sport?: string; year?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("sports-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("sports-photos")
    .getPublicUrl(path);

  const { data: photos } = await supabase
    .from("sports_photos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (photos?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("sports_photos").insert({
    url: urlData.publicUrl,
    title: data?.title || null,
    caption: data?.caption || null,
    sport: data?.sport || null,
    year: data?.year || null,
    sort_order: nextOrder,
  });

  if (insertError) throw insertError;
  revalidatePath("/dashboard/sports");
}

export async function removeSportsPhoto(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("sports_photos").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/sports");
}
