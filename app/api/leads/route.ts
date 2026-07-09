import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateQuote } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = calculateQuote({
      productPrice: Number(body.productPrice),
      currency: body.currency,
      weightKg: Number(body.weightKg),
      country: body.country,
      serviceTier: body.serviceTier,
    });

    const lead = await prisma.lead.create({
      data: {
        customerName: body.customerName || null,
        phone: body.phone || null,
        productUrl: body.productUrl,
        productName: body.productName || null,
        country: body.country,
        currency: body.currency,
        productPrice: Number(body.productPrice),
        weightKg: Number(body.weightKg),
        serviceTier: body.serviceTier,
        estimatedTotal: quote.total,
      },
    });

    return NextResponse.json({ ok: true, lead, quote });
  } catch {
    return NextResponse.json({ ok: false, message: "تعذر حفظ الطلب" }, { status: 400 });
  }
}
