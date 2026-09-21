"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { createOrder, type PaymentMethod, type ShipAddress } from "@/services/orders";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/services/payments";
import { applyOffer, type ApplyOfferResult } from "@/services/offers";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/utils/format";
import { fetchSiteSettings, isOn } from "@/services/settings";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  type Address,
} from "@/services/addresses";
import { SavedAddresses } from "@/components/checkout/SavedAddresses";
import { Container } from "@/components/ui/Container";
import { BackButton } from "@/components/ui/BackButton";
import { withRedirect } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import {
  CheckIcon,
  ChevronDownIcon,
  ShieldIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const METHODS: { id: PaymentMethod; title: string; desc: string; icon: typeof ShieldIcon }[] = [
  {
    id: "online",
    title: "Pay online",
    desc: "UPI · Cards · Net Banking · Wallets",
    icon: ShieldIcon,
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    desc: "Pay in cash when your order arrives",
    icon: TruckIcon,
  },
];

const addrField =
  "h-12 w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink placeholder:text-stone focus:border-ink focus:outline-none";

export default function PaymentPage() {
  const { items, subtotal, count, clear } = useCart();
  const { user, initializing } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    orderId?: string;
    method: PaymentMethod;
    /** Whether the shopper gave an address, so the copy can be honest. */
    email: boolean;
    /** Captured before the cart is cleared, for the confirmation screen. */
    total: number;
    deliverTo: string;
  } | null>(null);

  /*
   * Which part of checkout is on screen. Details (who and where) comes first,
   * then payment. It is presentation only: every field lives in the state
   * below whichever step shows it, so moving between steps loses nothing and
   * the order is built exactly as before.
   */
  const [step, setStep] = useState<"details" | "payment">("details");
  /** The address book has been read (or failed to be) — not the same as empty. */
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  /** Mobile only: the order summary starts folded so the form leads. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  /** The coupon field stays a single line until the shopper asks for it. */
  const [couponOpen, setCouponOpen] = useState(false);

  // Which payment methods the admin has enabled (Settings → Store controls).
  const [methodEnabled, setMethodEnabled] = useState({ online: true, cod: true });
  useEffect(() => {
    let active = true;
    void fetchSiteSettings().then((s) => {
      if (!active) return;
      const online = isOn(s, "payments.online");
      const cod = isOn(s, "payments.cod");
      setMethodEnabled({ online, cod });
      setMethod((m) => (m === "online" && !online ? "cod" : m === "cod" && !cod ? "online" : m));
    });
    return () => {
      active = false;
    };
  }, []);
  const availableMethods = METHODS.filter((m) => methodEnabled[m.id]);

  /*
   * The saved-address layer. `addingNew` is what decides between the card and
   * the form; the form fields below stay the source of truth for the order
   * either way, so validation and the courier hand-off are untouched.
   */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  /** True when the address book could not be read — not the same as empty. */
  const [addressesUnavailable, setAddressesUnavailable] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  /** The saved address being edited in place, if any. */
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Delivery address
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // Prefill the phone (last 10 digits) and name from the signed-in account.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.phone) setPhone((p) => p || user.phone!.replace(/\D/g, "").slice(-10));
    if (user?.name) setFullName((n) => n || user.name!);
  }, [user?.phone, user?.name]);

  /*
   * Checkout needs an account. Sending the shopper to sign in with this page
   * named as the destination is what lets them come straight back — the cart
   * lives in its own storage, so nothing is lost on the way.
   *
   * Waits for the session probe, or a returning shopper whose session is still
   * being restored would be bounced out of their own checkout.
   */
  useEffect(() => {
    if (initializing || user) return;
    router.replace(withRedirect("/account/login", "/checkout/payment"));
  }, [initializing, user, router]);

  /*
   * The customer's address book. Held rather than merely copied into the form,
   * so a returning shopper is shown the address they already gave us instead of
   * an empty form they have to fill in again.
   */
  useEffect(() => {
    if (!user?.phone) return;
    let active = true;
    void fetchAddresses(user.phone)
      .then((saved) => {
        if (!active) return;
        setAddresses(saved);
        setAddressesLoaded(true);
        const def = saved.find((a) => a.isDefault) ?? saved[0];
        if (!def) {
          // Nothing saved yet: the form is the only thing to show.
          setAddingNew(true);
          return;
        }
        setSelectedAddressId(def.id);
        // A returning customer already told us where to deliver: open on
        // payment, with that address shown and a Change link beside it.
        setStep("payment");
        // The whole saved address, not merged into the account prefill: the
        // name and mobile on the card are who this delivery goes to, which can
        // differ from the account holder. Nothing can have been typed yet —
        // the form is not shown until the book has loaded.
        setFullName(def.fullName);
        setPhone(def.phone.replace(/\D/g, "").slice(-10));
        setLine1(def.line1);
        setLine2(def.line2 ?? "");
        setCity(def.city);
        setStateName(def.state);
        setPincode(def.pincode);
      })
      .catch(() => {
        /*
         * The book could not be read. The form is still the only thing that can
         * be shown, but this is NOT the same as the customer having no saved
         * address — treating it as such is what made them retype one we already
         * held. Flagged so the form can say so and offer to look again.
         */
        if (!active) return;
        setAddressesLoaded(true);
        setAddressesUnavailable(true);
        setAddingNew(true);
      });
    return () => {
      active = false;
    };
  }, [user?.phone]);

  // Offer / coupon
  const [code, setCode] = useState("");
  const [offer, setOffer] = useState<ApplyOfferResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  // Stable key so the preview effect only re-runs when the cart truly changes.
  const itemsKey = items.map((i) => `${i.productHandle}:${i.size}:${i.quantity}`).join("|");

  // Auto-preview the active offer (no code) whenever the cart changes.
  useEffect(() => {
    let active = true;
    async function run() {
      if (items.length === 0) return;
      const res = await applyOffer(items, code.trim() || undefined);
      if (active) setOffer(res);
    }
    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  async function applyCoupon() {
    if (items.length === 0) return;
    setApplying(true);
    const res = await applyOffer(items, code.trim() || undefined);
    setApplying(false);
    setOffer(res);
    if (res?.applied) {
      setCouponMsg(res.message || "Offer applied.");
      toast(`🎉 Offer applied — you saved ${formatCurrency(res.discount)}!`, "success");
    } else {
      setCouponMsg(res?.message || "This code isn't valid for your cart.");
    }
  }

  const discount = offer?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  function finish(orderId: string | undefined, m: PaymentMethod) {
    setProcessing(false);
    setDone({
      orderId,
      method: m,
      email: Boolean(email.trim()),
      total,
      deliverTo: [fullName.trim(), city.trim()].filter(Boolean).join(", "),
    });
    clear();
    /*
     * After the order, never before: the address book is a convenience, and a
     * failure filing one away must not be able to affect a purchase that has
     * already gone through. The order carries its own copy of the address, so
     * it is complete whatever happens here.
     */
    void rememberAddressIfAsked();
  }

  function validate(): string | null {
    // Optional: delivery needs a phone and an address, not an email. A typed
    // value still has to be a real address, so a typo is caught rather than
    // silently saved; an empty field is simply left empty.
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return "Please enter a valid email, or leave it blank.";
    }
    if (fullName.trim().length < 2) return "Please enter the full name.";
    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) return "Enter a valid 10-digit phone number.";
    if (line1.trim().length < 4) return "Please enter the address (house / street).";
    if (city.trim().length < 2) return "Please enter the city.";
    if (stateName.trim().length < 2) return "Please enter the state.";
    if (!/^[0-9]{6}$/.test(pincode.trim())) return "Enter a valid 6-digit pincode.";
    return null;
  }

  /**
   * Re-reads the address book after a write that already succeeded.
   *
   * The write is on the server whether or not this read comes back, so a
   * failure here falls back to what the write returned instead of surfacing
   * "could not save" — which would send the customer round again and leave two
   * copies of the same address behind them.
   */
  async function refetchAddresses(fallback: Address[]): Promise<Address[]> {
    if (!user?.phone) return fallback;
    try {
      return await fetchAddresses(user.phone);
    } catch {
      return fallback;
    }
  }

  /** A single formatted delivery address string for the order + packing slip. */
  function composedAddress(): string {
    const parts = [line1.trim(), line2.trim(), `${city.trim()}, ${stateName.trim()} ${pincode.trim()}`]
      .filter(Boolean)
      .join(", ");
    return `${parts}. Ph: ${phone.replace(/\D/g, "")}`;
  }

  /** The same address, as individual fields — what the courier actually needs. */
  function structuredAddress(): ShipAddress {
    return {
      name: fullName.trim(),
      phone: phone.replace(/\D/g, ""),
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      country: "India",
    };
  }

  /** Fills the delivery form from an address, without changing what is shown. */
  function applyAddressFields(a: Address) {
    setFullName(a.fullName);
    setPhone(a.phone.replace(/\D/g, "").slice(-10));
    setLine1(a.line1);
    setLine2(a.line2 ?? "");
    setCity(a.city);
    setStateName(a.state);
    setPincode(a.pincode);
  }

  /** Selects a saved address for this order and returns to the card list. */
  function applyAddress(a: Address) {
    setSelectedAddressId(a.id);
    setAddingNew(false);
    setEditingAddressId(null);
    applyAddressFields(a);
  }

  /** Opens the delivery form on a saved address, to update that record. */
  function startEditAddress(a: Address) {
    setEditingAddressId(a.id);
    setAddingNew(true);
    setAddressError("");
    applyAddressFields(a);
  }

  /** Abandons an edit or a new entry and returns to the saved cards. */
  function cancelAddressEdit() {
    setEditingAddressId(null);
    setAddressError("");
    const back = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
    if (back) applyAddress(back);
    else setAddingNew(true); // nothing saved to fall back to
  }

  /**
   * Writes an edit back to the address book. PATCH on the same record, so the
   * customer ends up with one corrected address rather than two similar ones —
   * and because orders carry their own copy of the address, nothing already
   * placed is altered by this.
   */
  async function saveAddressEdit(): Promise<boolean> {
    if (!user?.phone || !editingAddressId) return false;
    const problem = validate();
    if (problem) {
      setAddressError(problem);
      toast(problem, "error");
      return false;
    }
    setSavingAddress(true);
    setAddressError("");
    try {
      const updated = await updateAddress(user.phone, editingAddressId, {
        fullName: fullName.trim(),
        phone: `+91${phone.replace(/\D/g, "").slice(-10)}`,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });
      const fresh = await refetchAddresses(
        addresses.map((a) => (a.id === editingAddressId ? updated : a)),
      );
      setAddresses(fresh);
      setEditingAddressId(null);
      const current = fresh.find((a) => a.id === editingAddressId);
      if (current) applyAddress(current);
      else setAddingNew(false);
      toast("Address updated.", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update this address.";
      setAddressError(message);
      toast(message, "error");
      return false;
    } finally {
      setSavingAddress(false);
    }
  }

  /**
   * Files the typed address in the address book, on its own.
   *
   * Deliberately separate from placing the order: saving used to happen only
   * after a purchase, so a customer who wanted to keep an address for next time
   * had no way to say so until it was too late to see that it worked.
   */
  async function saveNewAddress() {
    if (!user?.phone || savingAddress) return;

    const problem = validate();
    if (problem) {
      setAddressError(problem);
      toast(problem, "error");
      return;
    }

    // Already in the book: select that one rather than filing a second copy.
    const existing = addresses.find(sameAddress);
    if (existing) {
      applyAddress(existing);
      toast("This address is already saved.", "info");
      return;
    }

    setSavingAddress(true);
    setAddressError("");
    try {
      const saved = await createAddress(user.phone, {
        fullName: fullName.trim(),
        phone: `+91${phone.replace(/\D/g, "").slice(-10)}`,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });
      const fresh = await refetchAddresses([...addresses, saved]);
      setAddresses(fresh);
      // Select what was just saved, so the order uses the address the customer
      // was looking at when they pressed the button.
      applyAddress(fresh.find((a) => a.id === saved.id) ?? saved);
      toast("Address saved.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save this address.";
      setAddressError(message);
      toast(message, "error");
    } finally {
      setSavingAddress(false);
    }
  }

  /** Clears the form so a new address is entered rather than edited over. */
  function startNewAddress() {
    setSelectedAddressId(null);
    setEditingAddressId(null);
    setAddressError("");
    setAddingNew(true);
    setSaveAddress(true);
    // Name and mobile start from the account — the common case is delivering
    // to yourself — and stay editable for a gift or a different number.
    setFullName(user?.name ?? "");
    setPhone(user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : "");
    setLine1("");
    setLine2("");
    setCity("");
    setStateName("");
    setPincode("");
  }

  /**
   * Compares the parts a courier actually delivers to, ignoring the parts a
   * customer types inconsistently — case, spacing, and how the phone is
   * written. "1 Example St" typed twice is one address, not two.
   */
  function sameAddress(a: Address): boolean {
    const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
    const digits = (v: string) => v.replace(/\D/g, "").slice(-10);
    return (
      norm(a.line1) === norm(line1) &&
      norm(a.line2 ?? "") === norm(line2) &&
      norm(a.city) === norm(city) &&
      norm(a.state) === norm(stateName) &&
      norm(a.pincode) === norm(pincode) &&
      digits(a.phone) === digits(phone)
    );
  }

  /**
   * Adds the freshly typed address to the book, once the order it was entered
   * for exists. Only when the customer asked for it, only for a genuinely new
   * address, and only when it is not one they already have — otherwise placing
   * a second order from the same place would fill the book with copies.
   */
  async function rememberAddressIfAsked() {
    if (!user?.phone || !addingNew || !saveAddress) return;
    if (addresses.some(sameAddress)) return;
    try {
      await createAddress(user.phone, {
        fullName: fullName.trim(),
        phone: `+91${phone.replace(/\D/g, "").slice(-10)}`,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });
    } catch (err) {
      // The order is already placed; failing to file the address away is not
      // something to fail the purchase over.
      console.warn("Address not saved to the address book:", err);
    }
  }

  /** Moves to a step and brings its top into view. */
  function showStep(next: "details" | "payment") {
    setStep(next);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Details → Payment. Checks the same rules the order is placed under, so the
   * payment step can only be reached with a deliverable address. An open edit
   * of a saved address is saved on the way, rather than asking the customer to
   * find a second button first.
   */
  async function continueToPayment() {
    if (editingAddressId) {
      if (await saveAddressEdit()) showStep("payment");
      return;
    }
    const problem = validate();
    if (problem) {
      setError(problem);
      toast(problem, "error");
      return;
    }
    showStep("payment");
  }

  async function handlePay() {
    const problem = validate();
    if (problem) {
      setError(problem);
      toast(problem, "error");
      return;
    }
    setError("");
    setProcessing(true);

    // Order phone: keep the account phone for history when signed in, else the
    // delivery phone. Name + address always come from this form.
    const orderPhone = user?.phone ?? `+91${phone.replace(/\D/g, "")}`;
    const shippingAddress = composedAddress();
    const shipAddress = structuredAddress();
    const name = fullName.trim();

    try {
      // Cash on Delivery — no gateway, just record the order.
      if (method === "cod") {
        const order = await createOrder({
          email: email.trim(),
          items,
          paymentMethod: "cod",
          phone: orderPhone,
          fullName: name,
          shippingAddress,
          shipAddress,
          code,
        });
        if (order.ok) finish(order.orderId, "cod");
        else {
          setProcessing(false);
          setError(order.message);
        }
        return;
      }

      // Online — create a Razorpay order on the backend (amount is authoritative).
      const rp = await createRazorpayOrder(items, code);

      // Demo mode (no Razorpay keys configured) — record the order directly.
      if (rp.mock || !rp.keyId || !rp.orderId) {
        const order = await createOrder({
          email: email.trim(),
          items,
          paymentMethod: "online",
          phone: orderPhone,
          fullName: name,
          shippingAddress,
          shipAddress,
          code,
        });
        if (order.ok) finish(order.orderId, "online");
        else {
          setProcessing(false);
          setError(order.message);
        }
        return;
      }

      // Live Razorpay Checkout.
      const ready = await loadRazorpayScript();
      if (!ready) {
        setProcessing(false);
        setError("Couldn't load the payment gateway. Check your connection and retry.");
        return;
      }

      const result = await openRazorpayCheckout({
        keyId: rp.keyId,
        orderId: rp.orderId,
        // The server's amount is authoritative — Razorpay charges the order it
        // created, not this field. The fallback is the discounted total rather
        // than the subtotal so the widget can never show the pre-offer price.
        amount: rp.amount ?? total * 100,
        currency: rp.currency ?? "INR",
        name: "CONROY",
        description: `Order · ${count} item${count === 1 ? "" : "s"}`,
        prefill: { email, contact: orderPhone },
      });

      // Shopper closed the modal without paying.
      if (!result) {
        setProcessing(false);
        return;
      }

      // Verify the signature server-side, then the order is placed as paid.
      const verified = await verifyRazorpayPayment({
        email: email.trim(),
        items,
        phone: orderPhone,
        fullName: name,
        shippingAddress,
        shipAddress,
        code,
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      if (verified.ok) finish(verified.orderId, "online");
      else {
        setProcessing(false);
        setError(verified.message || "Payment verification failed. Please contact support.");
      }
    } catch (err) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    }
  }

  /* ---- Success ---------------------------------------------------------- */
  if (done) {
    return (
      <Container className="max-w-xl py-section-sm">
        <CheckoutProgress current={3} />
        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Order confirmed</h1>
          <p className="text-ink-soft">
            {done.method === "cod"
              ? "Your order is placed — pay in cash on delivery."
              : "Payment received and your order is confirmed."}
            {/* Only promised when an address was actually given — the line read
                as a receipt for an email that was never going anywhere. */}
            {done.email && " A confirmation will be sent to your email."}
          </p>
        </div>

        <dl className="mt-8 divide-y divide-line rounded-media border border-line bg-white text-sm">
          {done.orderId && (
            <div className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="text-stone">Order reference</dt>
              <dd className="font-medium text-ink">{done.orderId.slice(0, 8)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 px-5 py-3.5">
            <dt className="text-stone">{done.method === "cod" ? "To pay on delivery" : "Paid"}</dt>
            <dd className="font-medium text-ink">{formatCurrency(done.total)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3.5">
            <dt className="text-stone">Payment</dt>
            <dd className="text-ink">{done.method === "cod" ? "Cash on Delivery" : "Paid online"}</dd>
          </div>
          {done.deliverTo && (
            <div className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="shrink-0 text-stone">Delivering to</dt>
              <dd className="text-right text-ink">{done.deliverTo}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/collections/all">Continue shopping</Button>
          <Button href="/account/profile" variant="outline">
            View my orders
          </Button>
        </div>
      </Container>
    );
  }

  /* ---- Empty cart guard ------------------------------------------------- */
  if (items.length === 0) {
    return (
      <Container className="py-10">
        <div className="flex">
          <BackButton fallbackHref="/cart" />
        </div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Your cart is empty</h1>
          <p className="text-ink-soft">Add something before heading to payment.</p>
          <Button href="/collections/all">Shop the collection</Button>
        </div>
      </Container>
    );
  }

  /* ---- Checkout --------------------------------------------------------- */

  /** Waiting on the address book, so the form never flashes before the cards. */
  const loadingDetails = Boolean(user?.phone) && !addressesLoaded;
  const onDetails = step === "details";

  /** The one primary action, whatever the step. Shared by desktop and mobile. */
  const primaryLabel = onDetails
    ? editingAddressId
      ? savingAddress
        ? "Saving…"
        : "Save & continue"
      : "Continue to payment"
    : processing
      ? "Processing…"
      : method === "cod"
        ? "Place order"
        : `Pay ${formatCurrency(total)}`;
  const primaryDisabled = onDetails
    ? loadingDetails || savingAddress
    : processing || availableMethods.length === 0;
  const onPrimary = onDetails ? continueToPayment : handlePay;

  const deliveryLine = [line1.trim(), line2.trim(), `${city.trim()}, ${stateName.trim()} ${pincode.trim()}`]
    .filter(Boolean)
    .join(", ");

  return (
    // Bottom padding on mobile keeps the last card clear of the sticky action bar.
    <Container className="pb-32 pt-8 sm:pt-10 lg:pb-section-sm">
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackHref="/cart" />
        <p className="flex items-center gap-1.5 text-xs text-stone">
          <ShieldIcon className="h-4 w-4" /> Secure checkout
        </p>
      </div>

      <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Checkout</h1>
      <CheckoutProgress current={onDetails ? 1 : 2} disabled={processing} />

      {/* [&>*]:min-w-0 — auto-sized grid tracks cannot go below their content's
          minimum, so the form column widened the page instead of wrapping. */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10 [&>*]:min-w-0">
        <div className="space-y-5">
          {onDetails ? (
            <>
              {/* ---- Contact ---- */}
              <Panel title="Contact">
                {user?.phone && (
                  <p className="flex items-center gap-2.5 text-sm text-ink-soft">
                    <UserIcon className="h-4 w-4 shrink-0 text-stone" />
                    Signed in as{" "}
                    <span className="font-medium tabular-nums text-ink">
                      {formatPhone(user.phone)}
                    </span>
                  </p>
                )}
                <Field label="Email" optional className="mt-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For your order confirmation"
                    autoComplete="email"
                    className={addrField}
                  />
                </Field>
              </Panel>

              {/* ---- Delivery address ---- */}
              <Panel
                title="Delivery address"
                action={
                  addingNew && addresses.length > 0 && !editingAddressId ? (
                    <TextButton onClick={cancelAddressEdit}>Use a saved address</TextButton>
                  ) : editingAddressId ? (
                    <TextButton onClick={cancelAddressEdit} disabled={savingAddress}>
                      Cancel
                    </TextButton>
                  ) : null
                }
              >
                {loadingDetails ? (
                  <div role="status" aria-busy="true" className="space-y-3">
                    <span className="sr-only">Loading your saved addresses</span>
                    <div className="h-24 animate-pulse rounded-lg bg-mist" />
                    <div className="h-4 w-40 animate-pulse rounded bg-mist" />
                  </div>
                ) : (
                  <>
                    {addressesUnavailable && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-mist/40 px-4 py-3">
                        <p className="text-sm text-ink-soft">
                          We couldn&apos;t load your saved addresses. You can enter one below.
                        </p>
                        <TextButton onClick={() => window.location.reload()}>Try again</TextButton>
                      </div>
                    )}

                    {/* A returning customer sees what they already gave us. */}
                    {!addingNew && addresses.length > 0 && (
                      <div className="-mt-3">
                        <SavedAddresses
                          addresses={addresses}
                          selectedId={selectedAddressId}
                          onSelect={applyAddress}
                          onEdit={startEditAddress}
                          onAddNew={startNewAddress}
                          busy={processing}
                        />
                      </div>
                    )}

                    {(addingNew || addresses.length === 0) && (
                      <>
                        {editingAddressId && (
                          <p className="mb-4 text-sm text-ink-soft">
                            Editing a saved address. Changes are saved when you continue.
                          </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Full name">
                            <input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Who is receiving the order"
                              autoComplete="name"
                              className={addrField}
                            />
                          </Field>
                          <Field label="Mobile number">
                            <div className="flex h-12 items-center rounded-md border border-line bg-white focus-within:border-ink">
                              <span className="border-r border-line px-3 text-[15px] text-stone">+91</span>
                              <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="10-digit number"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                className="h-full min-w-0 flex-1 rounded-r-md bg-transparent px-3 text-[15px] text-ink placeholder:text-stone focus:outline-none"
                              />
                            </div>
                          </Field>
                          <Field label="House no., building, street" className="sm:col-span-2">
                            <input
                              value={line1}
                              onChange={(e) => setLine1(e.target.value)}
                              placeholder="Flat 12, Shanti Apartments, MG Road"
                              autoComplete="address-line1"
                              className={addrField}
                            />
                          </Field>
                          <Field label="Area / landmark" optional className="sm:col-span-2">
                            <input
                              value={line2}
                              onChange={(e) => setLine2(e.target.value)}
                              placeholder="Near City Mall"
                              autoComplete="address-line2"
                              className={addrField}
                            />
                          </Field>
                          {/* Pincode, city and state share one row from tablet
                              up; on a phone the pincode sits alone so its
                              numeric keypad is not squeezed. */}
                          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
                            <Field label="Pincode">
                              <input
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="6 digits"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                className={addrField}
                              />
                            </Field>
                            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                              <Field label="City">
                                <input
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  autoComplete="address-level2"
                                  className={addrField}
                                />
                              </Field>
                              <Field label="State">
                                <input
                                  value={stateName}
                                  onChange={(e) => setStateName(e.target.value)}
                                  autoComplete="address-level1"
                                  className={addrField}
                                />
                              </Field>
                            </div>
                          </div>
                        </div>

                        {/* A brand-new address can be kept for next time —
                            saved now with the button, or after the order if
                            the box is left ticked. */}
                        {!editingAddressId && user?.phone && (
                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                              <input
                                type="checkbox"
                                checked={saveAddress}
                                onChange={(e) => setSaveAddress(e.target.checked)}
                                className="h-4 w-4 accent-ink"
                              />
                              Save this address for future orders
                            </label>
                            {saveAddress && (
                              <button
                                type="button"
                                onClick={saveNewAddress}
                                disabled={savingAddress}
                                className="flex h-10 items-center justify-center rounded-md border border-ink px-5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
                              >
                                {savingAddress ? "Saving…" : "Save address"}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {addressError && (
                      <p className="mt-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
                        {addressError}
                      </p>
                    )}
                  </>
                )}
              </Panel>
            </>
          ) : (
            <>
              {/* ---- Deliver to (confirmed on the previous step) ---- */}
              <Panel
                title="Deliver to"
                action={
                  <TextButton onClick={() => showStep("details")} disabled={processing}>
                    Change
                  </TextButton>
                }
              >
                <div className="text-sm leading-relaxed">
                  <p className="font-medium text-ink">{fullName.trim()}</p>
                  <p className="mt-0.5 text-ink-soft">{deliveryLine}</p>
                  <p className="mt-0.5 break-words text-stone">
                    <span className="tabular-nums">+91 {phone}</span>
                    {email.trim() && <> · {email.trim()}</>}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-mist/50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2.5 text-ink-soft">
                    <TruckIcon className="h-4 w-4 shrink-0" /> Standard delivery
                  </span>
                  <span className="font-medium text-ink">Free</span>
                </div>
              </Panel>

              {/* ---- Payment method ---- */}
              <Panel title="Payment method">
                {availableMethods.length === 0 && (
                  <p className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
                    No payment methods are available right now. Please contact support.
                  </p>
                )}
                <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                  {availableMethods.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setMethod(m.id)}
                        disabled={processing}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                          active ? "border-ink bg-paper" : "border-line hover:border-ink",
                        )}
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mist text-ink">
                          <m.icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[15px] font-medium text-ink">{m.title}</span>
                          <span className="block text-sm text-stone">{m.desc}</span>
                        </span>
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                            active ? "border-ink bg-ink text-white" : "border-line",
                          )}
                        >
                          {active && <CheckIcon className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs text-stone">
                  <ShieldIcon className="h-4 w-4" /> Payments are encrypted and secure.
                </p>
              </Panel>
            </>
          )}

          {/* Mobile: the reason the primary action did nothing, above the bar. */}
          {error && (
            <p role="alert" className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent lg:hidden">
              {error}
            </p>
          )}
        </div>

        {/* ---- Order summary ----
            First on mobile, folded to one line so the form leads; a sticky
            sidebar from desktop up, always open. */}
        <aside className="order-first h-fit rounded-media border border-line bg-white lg:sticky lg:top-28 lg:order-none">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between gap-3 p-5 text-left lg:pointer-events-none lg:pb-0 lg:pt-6 sm:px-6"
          >
            <span>
              <span className="block font-display text-xl text-ink">Order summary</span>
              <span className="mt-0.5 block text-xs text-stone">
                {count} item{count === 1 ? "" : "s"}
                {discount > 0 && (
                  <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                    You save {formatCurrency(discount)}
                  </span>
                )}
              </span>
            </span>
            <span className="flex items-center gap-2 lg:hidden">
              <span className="font-medium text-ink">{formatCurrency(total)}</span>
              <ChevronDownIcon
                className={cn("h-4 w-4 text-stone transition-transform", summaryOpen && "rotate-180")}
              />
            </span>
          </button>

          <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", summaryOpen ? "block" : "hidden lg:block")}>
            <ul className="mt-2 space-y-4 border-t border-line pt-5 lg:mt-5">
              {items.map((item) => (
                <li key={`${item.productHandle}-${item.size}`} className="flex gap-3">
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-mist">
                    <SafeImage src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block text-ink">{item.title}</span>
                    <span className="block text-xs text-stone">
                      {item.fit} · Size {item.size} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="text-sm text-ink">
                    {formatCurrency(item.price * item.quantity, item.currency)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon — one line until it is wanted. */}
            <div className="mt-5 border-t border-line pt-4">
              {couponOpen || code ? (
                <>
                  <label htmlFor="coupon-code" className="mb-1.5 block text-xs text-ink-soft">
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon-code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setCouponMsg("");
                      }}
                      placeholder="Enter code"
                      /* min-w-0: an <input> carries a default intrinsic width, so
                         flex-1 alone could not shrink it and the row pushed the page
                         wider than a small phone. */
                      className="h-11 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-sm uppercase text-ink placeholder:normal-case placeholder:text-stone focus:border-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applying || !code.trim()}
                      className="shrink-0 rounded-md border border-ink px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-40"
                    >
                      {applying ? "Applying…" : "Apply"}
                    </button>
                  </div>
                  {couponMsg && (
                    <p className={cn("mt-2 text-xs", discount > 0 ? "text-green-700" : "text-accent")}>
                      {couponMsg}
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="flex w-full items-center gap-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  <TagIcon className="h-4 w-4 shrink-0" />
                  Have a coupon code?
                  <span className="ml-auto text-xs font-medium uppercase tracking-[0.14em] text-ink">
                    Add
                  </span>
                </button>
              )}
            </div>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="text-ink">{formatCurrency(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">
                    Discount{offer?.offer?.title ? ` · ${offer.offer.title}` : ""}
                  </dt>
                  <dd className="shrink-0 text-green-700">− {formatCurrency(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="text-ink">Free</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-line pt-4">
              <span className="font-display text-lg text-ink">Total</span>
              <span className="font-display text-lg text-ink">{formatCurrency(total)}</span>
            </div>

            {/* Desktop: the primary action lives with the total. */}
            <div className="hidden lg:block">
              {error && (
                <p role="alert" className="mt-4 text-xs text-accent">
                  {error}
                </p>
              )}
              <Button onClick={onPrimary} size="lg" className="mt-5 w-full" disabled={primaryDisabled}>
                {primaryLabel}
              </Button>
              {!onDetails && (
                <button
                  type="button"
                  onClick={() => showStep("details")}
                  className="mt-3 w-full text-center text-xs text-stone hover:text-ink"
                  disabled={processing}
                >
                  ← Back to details
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ---- Mobile action bar ----
          The total and the one action that matters, always in reach. Space on
          the right is left for the chat bubble that floats over this corner. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 py-3 pl-4 pr-[5.25rem]">
          <div className="shrink-0">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-stone">Total</p>
            <p className="font-display text-lg leading-tight text-ink">{formatCurrency(total)}</p>
          </div>
          <Button onClick={onPrimary} className="min-w-0 flex-1 px-4" disabled={primaryDisabled}>
            {primaryLabel}
          </Button>
        </div>
      </div>

      {/*
        * The handoff to the gateway is the one moment on the site where a
        * second click, a stray tap on the nav or a hit of Back can cost real
        * money — an order created twice, or a payment taken against an order
        * the shopper has walked away from. While it runs, the page is sealed.
        *
        * It covers the header too, so the only ways out are the ones the flow
        * itself provides. Razorpay's own modal renders far above this, so the
        * shopper can still pay; this simply holds the page still underneath.
        *
        * `processing` is already cleared on every exit — gateway dismissed,
        * verification refused, script unavailable, thrown error — and the
        * confirmed-order screen returns above this JSX, so success removes it
        * along with the rest of the form.
        */}
      {processing && (
        <div
          role="status"
          aria-live="assertive"
          aria-busy="true"
          /*
           * Above every other layer the storefront can raise — the offer
           * popups sit at 130, and one of those appearing over a payment in
           * flight would put a "shop the offer" link on top of it.
           */
          className="fixed inset-0 z-[200] grid place-items-center bg-background/85 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-5 px-6 text-center">
            <Loader label={method === "cod" ? "Placing order" : "Processing payment"} />
            <p className="max-w-xs text-xs text-stone">
              Please don&apos;t close or refresh this page.
            </p>
          </div>
        </div>
      )}
    </Container>
  );
}

/* ---- Presentation helpers ------------------------------------------------ */

const PROGRESS = ["Cart", "Details", "Payment", "Done"] as const;

/**
 * Where the shopper is in the purchase. Cart is always behind them (they came
 * from it) and stays a link back; the rest mark progress only.
 */
function CheckoutProgress({ current, disabled = false }: { current: 1 | 2 | 3; disabled?: boolean }) {
  return (
    <ol className="mt-5 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.14em]" aria-label="Checkout progress">
      {PROGRESS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const marker = (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.65rem] tabular-nums",
                state === "done" && "border-ink bg-ink text-white",
                state === "current" && "border-ink text-ink",
                state === "todo" && "border-line text-stone",
              )}
            >
              {state === "done" ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(state === "todo" ? "text-stone" : "text-ink", state === "current" && "font-medium")}>
              {label}
            </span>
          </span>
        );
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            {i === 0 && !disabled && current < 3 ? (
              <Link href="/cart" className="hover:opacity-70">
                {marker}
              </Link>
            ) : (
              marker
            )}
            {i < PROGRESS.length - 1 && (
              <span aria-hidden className={cn("h-px w-4 sm:w-10", i < current ? "bg-ink" : "bg-line")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** One checkout section: a white card with a title and an optional action. */
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-media border border-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A visible label over its input, so a field still says what it is once filled. */
function Field({
  label,
  optional = false,
  className,
  children,
}: {
  label: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs text-ink-soft">
        {label}
        {optional && <span className="text-stone"> (optional)</span>}
      </span>
      {children}
    </label>
  );
}

/** A quiet text action — Change, Cancel, Try again. */
function TextButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** "+919876543210" → "+91 98765 43210". */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : raw;
}
