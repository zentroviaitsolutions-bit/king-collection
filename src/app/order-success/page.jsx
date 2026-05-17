"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function OrderSuccessPageContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order");

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl text-white">
          ✓
        </div>

        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-black/50">
          Success
        </p>
        <h1 className="mt-2 text-4xl font-bold">Order Placed Successfully</h1>

        <p className="mx-auto mt-4 max-w-2xl text-black/60">
          Thank you for shopping with King Collection. Your order has been
          received and is now being processed.
        </p>

        {order && (
          <div className="mt-6 rounded-2xl bg-black/5 px-4 py-4">
            <p className="text-sm text-black/50">Order Number</p>
            <p className="mt-1 text-xl font-semibold">{order}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/orders"
            className="rounded-full bg-black px-6 py-3 font-medium text-white"
          >
            View Orders
          </Link>
          <Link
            href={order ? `/track-order?order=${order}` : "/track-order"}
            className="rounded-full border border-black/10 px-6 py-3 font-medium"
          >
            Track Order
          </Link>
          <Link
            href="/collections"
            className="rounded-full border border-black/10 px-6 py-3 font-medium"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm md:p-12">
            Loading your order details...
          </div>
        </main>
      }
    >
      <OrderSuccessPageContent />
    </Suspense>
  );
}
