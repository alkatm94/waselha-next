import { NextResponse } from "next/server";
import { logoutCustomer } from "@/lib/auth";

export async function POST(request: Request) {
  await logoutCustomer();
  return NextResponse.redirect(new URL("/", request.url));
}
