"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/src/lib/family";

export type DeathBoxItem = {
  id: string;
  title: string;
  content: string | null;
  category: string;
  sort_order: number;
  is_completed: boolean;
  file_url: string | null;
};

export async function getDeathBoxItems(): Promise<DeathBoxItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return [];

  const { data, error } = await supabase
    .from("death_box_items")
    .select("id, title, content, category, sort_order, is_completed, file_url")
    .eq("family_id", activeFamilyId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data || []) as DeathBoxItem[];
}

export async function toggleDeathBoxItem(id: string, isCompleted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("death_box_items")
    .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/death-box");
}

export async function uploadDeathBoxFile(itemId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("No file selected.");

  const ext = file.name.split(".").pop() || "bin";
  const path = `${itemId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("death-box-files")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("death-box-files")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("death_box_items")
    .update({
      file_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (updateError) throw updateError;
  revalidatePath("/dashboard/death-box");
}
