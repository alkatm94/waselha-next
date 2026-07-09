import { NextResponse } from "next/server";
import { calculateQuote } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = calculateQuote({
      productPrice: Number(body.productPrice),
      currency: body.currency,
      weightKg: Number(body.weightKg),
      country: body.country,
      serviceTier: body.serviceTier,
    });

    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ ok: false, message: "تعذر حساب السعر" }, { status: 400 });
  }
}
