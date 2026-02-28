import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddPetForm } from "./AddPetForm";
import { PetList } from "./PetList";

export default async function PetsPage() {
  const supabase = await createClient();
  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) return null;

  const { data: pets } = await supabase
    .from("family_pets")
    .select(`
      id,
      name,
      species,
      breed,
      birthday,
      adopted_date,
      passed_date,
      description,
      pet_owners(member_id, member:family_members(name)),
      pet_photos(id, url, sort_order)
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← Home
          </Link>
          <h1 className="mt-2 font-display text-4xl font-bold text-[var(--foreground)]">
            Family Pets 🐾
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)]">
            Every paw, fin, and feather that&apos;s been part of your family story.
          </p>
        </div>
        <AddPetForm />
      </div>

      <PetList pets={(pets ?? []) as unknown as Parameters<typeof PetList>[0]["pets"]} />
    </div>
  );
}
