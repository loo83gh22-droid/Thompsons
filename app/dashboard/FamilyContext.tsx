"use client";

import { createContext, useContext } from "react";

type FamilyContextValue = {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
};

const FamilyContext = createContext<FamilyContextValue>({
  activeFamilyId: null,
  families: [],
});

export function FamilyProvider({
  activeFamilyId,
  families,
  children,
}: {
  activeFamilyId: string | null;
  families: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  return (
    <FamilyContext.Provider value={{ activeFamilyId, families }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
