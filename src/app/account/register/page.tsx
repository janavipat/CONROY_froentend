import type { Metadata } from "next";
import { LoginExperience } from "@/components/auth/LoginExperience";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your CONROY account with your mobile number.",
  alternates: { canonical: "/account/register" },
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <LoginExperience mode="signup" />;
}
