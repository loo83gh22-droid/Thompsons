import { redirect } from "next/navigation";

export const metadata = { title: "Welcome | Family Nest" };

export default function OnboardingPage() {
  redirect("/dashboard/members");
}
