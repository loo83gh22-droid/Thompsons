import { redirect } from "next/navigation";

export const metadata = { title: "Family Tree | Family Nest" };

export default function FamilyTreePage() {
  redirect("/dashboard/our-family");
}
