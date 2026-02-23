import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { familyId, name } = body as { familyId?: string; name?: string };

    if (!familyId || !name?.trim()) {
      return NextResponse.json(
        { error: "Family ID and name are required" },
        { status: 400 }
      );
    }

    const trimmed = name.trim().slice(0, 50);

    // Verify user is the family owner — only owners can rename the family
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have access to this family" },
        { status: 403 }
      );
    }
    if (membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the family owner can rename the family" },
        { status: 403 }
      );
    }

    // Update family name — use .select() to verify the update actually took effect
    const { data: updated, error } = await supabase
      .from("families")
      .update({ name: trimmed })
      .eq("id", familyId)
      .select("id, name")
      .maybeSingle();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!updated) {
      return NextResponse.json(
        { error: "Could not update family name. Please try again." },
        { status: 500 }
      );
    }

    // Also update family_settings if it exists
    await supabase
      .from("family_settings")
      .update({ family_name: trimmed })
      .eq("family_id", familyId);

    // Revalidate all dashboard pages so the layout re-fetches the family name
    revalidatePath("/dashboard", "layout");

    return NextResponse.json({ name: updated.name });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
