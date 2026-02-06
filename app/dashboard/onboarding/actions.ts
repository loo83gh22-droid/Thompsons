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
    // No user_id - they'll be linked when they sign up with this email
  });

  if (error) throw error;
  revalidatePath("/dashboard/onboarding");
  revalidatePath("/dashboard");
}
