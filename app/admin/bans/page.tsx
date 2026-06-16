import { redirect } from "next/navigation";

export default function AdminBansRedirect() {
  redirect("/admin?tab=bans");
}
