import { redirect } from "next/navigation";

export const metadata = { title: "Achievements | Family Nest" };

export default function AchievementsPage() {
  redirect("/dashboard/trophy-case");
}
