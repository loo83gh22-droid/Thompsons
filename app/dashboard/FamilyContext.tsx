"use client";

import { createContext, useContext } from "react";
import type { MemberRole } from "@/src/lib/roles";

type FamilyContextValue = {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
  /** Current user's role in the active family */
  currentUserRole: MemberRole;
  /** Current user's family_member ID in the active family */
  currentMemberId: string | null;
};

const FamilyContext = createContext<FamilyContextValue>({
  activeFamilyId: null,
  families: [],
  currentUserRole: "adult",
  currentMemberId: null,
});

export function FamilyProvider({
  activeFamilyId,
  families,
  currentUserRole = "adult",
  currentMemberId = null,
  children,
}: {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
  currentUserRole?: MemberRole;
  currentMemberId?: string | null;
  children: React.ReactNode;
}) {
  return (
    <FamilyContext.Provider value={{ activeFamilyId, families, currentUserRole, currentMemberId }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
