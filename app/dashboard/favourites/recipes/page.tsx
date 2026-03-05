import { redirect } from "next/navigation";

export const metadata = { title: "Favourite Recipes | Family Nest" };

export default function RecipesRedirect() {
  redirect("/dashboard/recipes");
}
