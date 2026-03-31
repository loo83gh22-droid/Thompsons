import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { ContactsClient } from "./ContactsClient";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Family Contacts | Family Nest" };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) redirect("/dashboard");

  const { data: contacts } = await supabase
    .from("family_contacts")
    .select("id, name, email, relationship, notes, birthday, created_at")
    .eq("family_id", activeFamilyId)
    .order("name");

  return <ContactsClient contacts={contacts ?? []} />;
}
