import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import EmergencyInfoClient from "./EmergencyInfoClient";

export const metadata = { title: "Emergency Info | Family Nest" };

export default async function EmergencyInfoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const [membersRes, contactsRes, medicalRes] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, name, nickname, role, avatar_url")
      .eq("family_id", activeFamilyId)
      .order("name"),
    supabase
      .from("emergency_contacts")
      .select("*")
      .eq("family_id", activeFamilyId)
      .order("sort_order"),
    supabase
      .from("medical_info")
      .select("*")
      .eq("family_id", activeFamilyId),
  ]);

  return (
    <EmergencyInfoClient
      members={membersRes.data ?? []}
      contacts={contactsRes.data ?? []}
      medicalRecords={medicalRes.data ?? []}
    />
  );
}
