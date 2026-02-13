"use client";

import { createContext, useContext } from "react";
import type { MemberRole } from "@/src/lib/roles";
import type { PlanType } from "@/src/lib/plans";

type FamilyContextValue = {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
  /** Current user's role in the active family */
  currentUserRole: MemberRole;
  /** Current user's family_member ID in the active family */
  currentMemberId: string | null;
  /** Family's current plan tier */
  planType: PlanType;
};

const FamilyContext = createContext<FamilyContextValue>({
  activeFamilyId: null,
  families: [],
  currentUserRole: "adult",
  currentMemberId: null,
  planType: "free",
});

export function FamilyProvider({
  activeFamilyId,
  families,
  currentUserRole = "adult",
  currentMemberId = null,
  planType = "free",
  children,
}: {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
  currentUserRole?: MemberRole;
  currentMemberId?: string | null;
  planType?: PlanType;
  children: React.ReactNode;
}) {
  return (
    <FamilyContext.Provider value={{ activeFamilyId, families, currentUserRole, currentMemberId, planType }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
