"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { getStatusLabel } from "@/lib/helpers/orderStatus";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      const orderNumber = searchParams.get("order");
      toast.success(
        orderNumber
          ? `Order placed successfully: ${orderNumber}`
          : "Order placed successfully"
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    async function fetchOrders() {
      if (!user) return;

      try {
        setPageLoading(true);

        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(data || []);
      } catch (error) {
        toast.error(error.message || "Failed to fetch orders");
      } finally {
        setPageLoading(false);
      }
    }

    fetchOrders();
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          Loading orders...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Orders
          </p>
          <h1 className="mt-2 text-4xl font-bold">My Orders</h1>
        </div>

        <Link
          href="/collections"
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium"
        >
          Continue Shopping
        </Link>
      </div>

      {!orders.length ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold">No orders yet</h2>
          <p className="mt-2 text-black/60">
            Once you place an order, it will appear here.
          </p>
          <Link
            href="/collections"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-black/50">Order Number</p>
                  <h2 className="text-xl font-semibold">{order.order_number}</h2>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-black/60">
                    <span>
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                    <span>Payment: {order.payment_method?.toUpperCase()}</span>
                    <span>Status: {getStatusLabel(order.order_status)}</span>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-black/50">Total</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              </div>

              {!!order.order_items?.length && (
                <div className="mt-5 space-y-3 border-t border-black/10 pt-5">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-2xl bg-black/5 p-4"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-black/60">
                          Qty: {item.quantity}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-black/60">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                      </div>
                      <p className="font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/orders/${order.order_number}`}
                  className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium"
                >
                  View Details
                </Link>
                <Link
                  href={`/track-order?order=${order.order_number}`}
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}