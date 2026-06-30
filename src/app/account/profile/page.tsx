import type { Metadata } from "next";
import { ProfileExperience } from "@/components/account/ProfileExperience";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your CONROY account, orders and addresses.",
  alternates: { canonical: "/account/profile" },
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileExperience />;
}
