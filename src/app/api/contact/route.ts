import { NextResponse } from "next/server";

/**
 * Contact form endpoint. In production this would forward to an email service
 * or CRM; here it validates input and acknowledges receipt.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body ?? {};

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, message: "Please complete all required fields." },
        { status: 400 },
      );
    }

    // TODO: integrate with email/CRM provider (Resend, SendGrid, Shopify, …).

    return NextResponse.json({
      ok: true,
      message: "Thank you — your enquiry has been received. We'll be in touch shortly.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
