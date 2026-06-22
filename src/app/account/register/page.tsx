import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";
import { AuthForm } from "@/components/forms/AuthForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a CONROY account for faster checkout and order tracking.",
  alternates: { canonical: "/account/register" },
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Create Account"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Register" }]}
      />
      <section className="py-16 lg:py-24">
        <Container className="max-w-md">
          <AuthForm mode="register" />
        </Container>
      </section>
    </>
  );
}
