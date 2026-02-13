import { createClient } from "@/src/lib/supabase/server";
import { getActiveFamilyId } from "@/src/lib/family";
import { NextResponse } from "next/server";
import { getFamilyPlan, canManageNestKeepers } from "@/src/lib/plans";

// GET: Fetch nest keepers for the current family
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    // Nest Keepers is Legacy-only
    const plan = await getFamilyPlan(supabase, activeFamilyId);
    if (!canManageNestKeepers(plan.planType))
      return NextResponse.json({ error: "Nest Keepers requires the Legacy plan." }, { status: 403 });

    const { data, error } = await supabase
      .from("nest_keepers")
      .select("*")
      .eq("family_id", activeFamilyId)
      .order("priority", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ keepers: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a new nest keeper (max 3 per family)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    const plan = await getFamilyPlan(supabase, activeFamilyId);
    if (!canManageNestKeepers(plan.planType))
      return NextResponse.json({ error: "Nest Keepers requires the Legacy plan." }, { status: 403 });

    // Check current count
    const { count } = await supabase
      .from("nest_keepers")
      .select("id", { count: "exact", head: true })
      .eq("family_id", activeFamilyId);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Maximum of 3 Nest Keepers allowed per family" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, relationship } = body as {
      name?: string;
      email?: string;
      relationship?: string;
    };

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Determine next priority slot
    const { data: existing } = await supabase
      .from("nest_keepers")
      .select("priority")
      .eq("family_id", activeFamilyId)
      .order("priority", { ascending: true });

    const usedPriorities = new Set(existing?.map((k) => k.priority) ?? []);
    let nextPriority = 1;
    while (usedPriorities.has(nextPriority) && nextPriority <= 3)
      nextPriority++;

    const { data, error } = await supabase
      .from("nest_keepers")
      .insert({
        family_id: activeFamilyId,
        designated_by: user.id,
        email: email.trim(),
        name: name?.trim() || null,
        relationship: relationship?.trim() || null,
        priority: nextPriority,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ keeper: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update keeper details or priority
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    const body = await request.json();
    const { id, name, email, relationship, priority } = body as {
      id?: string;
      name?: string;
      email?: string;
      relationship?: string;
      priority?: number;
    };

    if (!id)
      return NextResponse.json(
        { error: "Keeper id is required" },
        { status: 400 }
      );

    // Build update payload — only include provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim() || null;
    if (email !== undefined) {
      if (!email.trim())
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      updates.email = email.trim();
    }
    if (relationship !== undefined)
      updates.relationship = relationship.trim() || null;

    // Handle priority swap
    if (priority !== undefined) {
      if (priority < 1 || priority > 3)
        return NextResponse.json(
          { error: "Priority must be between 1 and 3" },
          { status: 400 }
        );

      // Check if another keeper already occupies that priority
      const { data: occupant } = await supabase
        .from("nest_keepers")
        .select("id, priority")
        .eq("family_id", activeFamilyId)
        .eq("priority", priority)
        .neq("id", id)
        .maybeSingle();

      if (occupant) {
        // Get current keeper's priority
        const { data: current } = await supabase
          .from("nest_keepers")
          .select("priority")
          .eq("id", id)
          .single();

        if (current) {
          // Swap: move occupant to current keeper's old priority
          await supabase
            .from("nest_keepers")
            .update({ priority: current.priority })
            .eq("id", occupant.id);
        }
      }

      updates.priority = priority;
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("nest_keepers")
      .update(updates)
      .eq("id", id)
      .eq("family_id", activeFamilyId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ keeper: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a nest keeper
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { activeFamilyId } = await getActiveFamilyId(supabase);
    if (!activeFamilyId)
      return NextResponse.json({ error: "No active family" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Keeper id is required" },
        { status: 400 }
      );

    const { error } = await supabase
      .from("nest_keepers")
      .delete()
      .eq("id", id)
      .eq("family_id", activeFamilyId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
