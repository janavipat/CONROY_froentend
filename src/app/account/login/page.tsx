import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";
import { LoginPanel } from "@/components/forms/LoginPanel";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your CONROY account.",
  alternates: { canonical: "/account/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <>
      <PageHeader
        title="Login"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Login" }]}
      />
      <section className="py-16 lg:py-24">
        <Container className="max-w-md">
          <LoginPanel />
        </Container>
      </section>
    </>
  );
}
