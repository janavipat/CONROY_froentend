import { NextResponse } from "next/server";

/** Newsletter subscription endpoint (stubbed). */
export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) ?? {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    // TODO: persist to mailing-list provider.

    return NextResponse.json({ ok: true, message: "You're on the list. Welcome to CONROY." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
