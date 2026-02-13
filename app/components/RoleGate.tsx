"use client";

import { useFamily } from "@/app/dashboard/FamilyContext";
import type { MemberRole } from "@/src/lib/roles";

/**
 * Conditionally render children based on the current user's role.
 *
 * @param allow - Roles that can see this content
 * @param fallback - Optional content to show for disallowed roles
 */
export function RoleGate({
  allow,
  fallback = null,
  children,
}: {
  allow: MemberRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { currentUserRole } = useFamily();
  if (allow.includes(currentUserRole)) return <>{children}</>;
  return <>{fallback}</>;
}

/**
 * Only renders for the account owner.
 */
export function OwnerOnly({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow={["owner"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Renders for adults and owner (anyone who can create content for others).
 */
export function AdultOnly({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow={["owner", "adult"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}
