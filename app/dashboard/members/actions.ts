"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addFamilyMember(name: string, relationship: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("family_members").insert({
    name: name.trim(),
    relationship: relationship.trim() || null,
    contact_email: email.trim() || null,
  });

  if (error) throw error;
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}

export async function updateFamilyMember(
  id: string,
  name: string,
  relationship: string,
  email: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("family_members")
    .update({
      name: name.trim(),
      relationship: relationship.trim() || null,
      contact_email: email.trim() || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}

export async function deleteFamilyMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("family_members").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}
