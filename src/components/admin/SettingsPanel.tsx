"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";
import { clearAdminKey } from "@/lib/admin-auth";
import { useToast } from "@/components/ui/Toast";
import {
  fetchSiteSettings,
  adminUpdateSettings,
  isOn,
  settingValue,
  HOMEPAGE_SECTIONS,
  type SettingsMap,
} from "@/services/settings";
import { CogIcon, ShieldIcon, TruckIcon, MailIcon, GridIcon, HeadsetIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        checked ? "bg-emerald-500" : "bg-stone/30",
      )}
    >
      <span
        style={{ left: checked ? "22px" : "2px" }}
        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200"
      />
    </button>
  );
}

function Card({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof CogIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-media border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-ink">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-display text-lg text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-stone">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <div>
        <p className="text-sm text-ink">{label}</p>
        {hint && <p className="text-xs text-stone">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0">
      <span className="text-sm text-stone">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

export function SettingsPanel() {
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSiteSettings()
      .then((s) => active && (setSettings(s), setLoading(false)))
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function setBool(key: string, value: boolean) {
    setSettings((s) => ({ ...s, [key]: value ? "true" : "false" }));
    setDirty(true);
  }
  function setText(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await adminUpdateSettings(settings);
      if (res.ok) {
        setDirty(false);
        toast("Settings saved — changes are live on the storefront.", "success");
      } else {
        toast(res.message || "Could not save settings.", "error");
      }
    } catch {
      toast("Could not save. Run the latest DB migration, then retry.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-20">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-stone">
          Control what shows on your storefront and how the store behaves.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Homepage sections — show/hide */}
          <Card icon={GridIcon} title="Homepage sections" subtitle="Turn storefront sections on or off">
            {HOMEPAGE_SECTIONS.map((s) => (
              <ToggleRow
                key={s.key}
                label={s.label}
                checked={isOn(settings, s.key)}
                onChange={(v) => setBool(s.key, v)}
              />
            ))}
          </Card>

          {/* Store controls */}
          <Card icon={ShieldIcon} title="Store controls">
            <ToggleRow
              label="Cash on Delivery"
              hint="Offer COD at checkout"
              checked={isOn(settings, "payments.cod")}
              onChange={(v) => setBool("payments.cod", v)}
            />
            <ToggleRow
              label="Online payment (Razorpay)"
              hint="Offer online payment at checkout"
              checked={isOn(settings, "payments.online")}
              onChange={(v) => setBool("payments.online", v)}
            />
            <ToggleRow
              label="Maintenance mode"
              hint="Show a store-wide notice banner to shoppers"
              checked={isOn(settings, "store.maintenance")}
              onChange={(v) => setBool("store.maintenance", v)}
            />
          </Card>

          {/* Contact */}
          <Card icon={HeadsetIcon} title="Contact" subtitle="Where enquiries are sent">
            <label className="block text-sm text-ink">WhatsApp number (with country code)</label>
            <input
              value={settingValue(settings, "contact.whatsapp")}
              onChange={(e) => setText("contact.whatsapp", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="919998009904"
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink"
            />
            <p className="mt-2 text-xs text-stone">
              The Contact page &ldquo;Send message&rdquo; button opens WhatsApp to this number.
            </p>
          </Card>

          {/* Store details (read-only from config) */}
          <Card icon={CogIcon} title="Store details">
            <Row label="Store name" value={SITE.name} />
            <Row label="Legal name" value={SITE.legalName} />
            <Row label="Support email" value={SITE.contact.email} />
            <Row label="Hours" value={SITE.contact.hours} />
          </Card>

          {/* Shipping */}
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

          {/* Notifications */}
          <Card icon={MailIcon} title="Notifications">
            <Row label="Order emails" value="Via SMTP" />
            <Row label="Welcome email" value="On signup" />
            <p className="mt-3 text-xs text-stone">
              Set SMTP credentials in the backend <code>.env</code> to send real emails.
            </p>
          </Card>
        </div>
      )}

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

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur md:pl-60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <span className="text-xs text-stone">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </span>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
