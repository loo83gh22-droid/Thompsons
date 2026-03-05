import { redirect } from "next/navigation";

export const metadata = { title: "Family Members | Family Nest" };

export default function MembersIndexPage() {
  redirect("/dashboard/our-family");
}
