import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { AddPetForm } from "./AddPetForm";
import { PetList } from "./PetList";

export const metadata = { title: "Family Pets | Family Nest" };

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
      has_passed,
      passed_date,
      description,
      pet_owners(member_id, member:family_members(name)),
      cover_photo_id,
      pet_photos!pet_photos_pet_id_fkey(id, url, sort_order)
    `)
    .eq("family_id", activeFamilyId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Family Pets 🐾
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Every paw, fin, and feather that&apos;s been part of your family story.
          </p>
        </div>
        <AddPetForm />
      </div>

      <PetList pets={(pets ?? []) as unknown as Parameters<typeof PetList>[0]["pets"]} />
    </div>
  );
}
