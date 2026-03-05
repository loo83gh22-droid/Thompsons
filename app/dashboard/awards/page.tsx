import { redirect } from "next/navigation";

export const metadata = { title: "Awards | Family Nest" };

export default function AwardsPage() {
  redirect("/dashboard/trophy-case");
}
