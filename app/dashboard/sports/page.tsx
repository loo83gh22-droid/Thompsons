import { redirect } from "next/navigation";

export const metadata = { title: "Sports | Family Nest" };

export default function SportsPage() {
  redirect("/dashboard/trophy-case");
}
