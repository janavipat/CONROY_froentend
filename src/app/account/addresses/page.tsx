import type { Metadata } from "next";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your saved delivery addresses.",
  alternates: { canonical: "/account/addresses" },
  robots: { index: false, follow: true },
};

export default function AddressesPage() {
  return <AddressBook />;
}
