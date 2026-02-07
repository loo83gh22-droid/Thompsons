"use server";

import { cookies } from "next/headers";

export async function setActiveFamily(familyId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_family_id", familyId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
