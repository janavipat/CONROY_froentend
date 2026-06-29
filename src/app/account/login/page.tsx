import type { Metadata } from "next";
import { LoginExperience } from "@/components/auth/LoginExperience";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CONROY account with your mobile number.",
  alternates: { canonical: "/account/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginExperience />;
}
