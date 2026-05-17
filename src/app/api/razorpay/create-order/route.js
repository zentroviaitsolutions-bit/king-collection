import { NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";

export async function POST(req) {
  try {
    const body = await req.json();
    const amount = Number(body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (error) {
    const status = error.message?.includes("Razorpay is not configured")
      ? 503
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order" },
      { status }
    );
  }
}
