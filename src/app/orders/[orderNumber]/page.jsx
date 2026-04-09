"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";

export default function OrderDetailPage({ params }) {
  const router = useRouter();

  const { orderNumber } = use(params); // ✅ FIX

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (error) {
        toast.error(error.message || "Failed to fetch order");
      } else {
        setOrder(data);
      }

      setLoading(false);
    }

    fetchOrder();
  }, [orderNumber]); // ✅ FIX

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          Loading order...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          Order not found.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">
          Order #{order.order_number}
        </h1>

        <div className="space-y-2 text-sm text-black/70">
          <p>
            {order.full_name} · {order.phone}
          </p>
          <p>
            {order.address_line1}, {order.city}, {order.state}
          </p>
          <p>
            Payment: {order.payment_method} / {order.payment_status}
          </p>
          <p>Status: {order.order_status}</p>
        </div>

        {!!order.order_items?.length && (
          <div className="mt-6 space-y-3 border-t border-black/10 pt-5">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-black/5 p-4"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-black/60">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">₹{item.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}