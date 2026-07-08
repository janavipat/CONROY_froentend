"use client";

import Link from "next/link";
import { SITE } from "@/lib/site";
import { clearAdminKey } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { CogIcon, ShieldIcon, TruckIcon, MailIcon } from "@/components/ui/Icons";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0">
      <span className="text-sm text-stone">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CogIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-media border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-ink">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsPanel() {
  const router = useRouter();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-stone">Store details and configuration.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card icon={CogIcon} title="Store details">
          <Row label="Store name" value={SITE.name} />
          <Row label="Legal name" value={SITE.legalName} />
          <Row label="Support email" value={SITE.contact.email} />
          <Row label="Phone" value={SITE.contact.phone} />
          <Row label="Hours" value={SITE.contact.hours} />
        </Card>

        <Card icon={TruckIcon} title="Shipping & returns">
          <Row label="Shipping" value="Free across India" />
          <Row label="Returns window" value="7 days" />
          <p className="mt-3 text-xs text-stone">
            Manage return requests in{" "}
            <Link href="/admin/returns" className="text-ink underline-offset-2 hover:underline">
              Orders → Returns
            </Link>
            .
          </p>
        </Card>

        <Card icon={ShieldIcon} title="Payments">
          <Row label="Online" value="Razorpay" />
          <Row label="Cash on Delivery" value="Enabled" />
          <p className="mt-3 text-xs text-stone">
            Configure Razorpay keys in the backend <code>.env</code> (RAZORPAY_KEY_ID / SECRET).
          </p>
        </Card>

        <Card icon={MailIcon} title="Notifications">
          <Row label="Order emails" value="Via SMTP" />
          <Row label="Welcome email" value="On signup" />
          <p className="mt-3 text-xs text-stone">
            Set SMTP credentials in the backend <code>.env</code> to send real emails.
          </p>
        </Card>
      </div>

      {/* Admin access */}
      <section className="mt-5 rounded-media border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-ink">
            <ShieldIcon className="h-4.5 w-4.5" />
          </span>
          <h2 className="font-display text-lg text-ink">Admin access</h2>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          The admin panel is protected by an admin key (set as <code>ADMIN_KEY</code> in the backend).
          Change it there and enter the new key when signing in.
        </p>
        <button
          onClick={() => {
            clearAdminKey();
            router.replace("/admin/login");
          }}
          className="mt-4 rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Sign out of admin
        </button>
      </section>
    </div>
  );
}
