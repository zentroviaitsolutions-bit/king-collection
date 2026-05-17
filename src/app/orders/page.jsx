"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getRemainingOrderPayload } from "@/lib/helpers/orderCancellation";
import { formatPrice } from "@/lib/helpers/formatPrice";
import {
  getStatusLabel,
  isOrderCancelable,
} from "@/lib/helpers/orderStatus";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancellingItemId, setCancellingItemId] = useState(null);

  async function fetchOrders(currentUser = user) {
    if (!currentUser) return;

    try {
      setPageLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(slug))")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders((data || []).filter((order) => order.order_status !== "cancelled"));
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setPageLoading(false);
    }
  }

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
      setPageLoading(false);
      router.push("/login");
      return;
    }
    if (user) {
      fetchOrders(user);
    }
  }, [user, loading, router]);

  async function cancelOrder(order) {
    if (!user?.id) return;
    if (!isOrderCancelable(order.order_status)) {
      toast.error("This order can no longer be cancelled.");
      return;
    }

    try {
      setCancellingId(order.id);

      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      if (itemsError) throw itemsError;

      const { error } = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Order cancelled successfully");
      setOrders((prev) => prev.filter((entry) => entry.id !== order.id));
    } catch (error) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  }

  async function cancelOrderItem(order, item) {
    if (!user?.id) return;
    if (!isOrderCancelable(order.order_status)) {
      toast.error("This product can no longer be cancelled.");
      return;
    }

    try {
      setCancellingItemId(item.id);

      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("id", item.id)
        .eq("order_id", order.id);

      if (deleteError) throw deleteError;

      const { remainingItems, payload } = getRemainingOrderPayload(order, item.id);
      const { error: orderError } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", order.id)
        .eq("user_id", user.id);

      if (orderError) throw orderError;

      toast.success("Product cancelled successfully");
      setOrders((prev) =>
        prev
          .map((entry) =>
            entry.id !== order.id
              ? entry
              : {
                  ...entry,
                  ...payload,
                  order_items: remainingItems,
                }
          )
          .filter(
            (entry) =>
              entry.id !== order.id ||
              (remainingItems.length > 0 && payload.order_status !== "cancelled")
          )
      );
    } catch (error) {
      toast.error(error.message || "Failed to cancel product");
    } finally {
      setCancellingItemId(null);
    }
  }

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
          <h1 className="mt-2 font-serif text-4xl font-bold">My Orders</h1>
          <p className="mt-3 text-sm text-black/60">
            Track deliveries, review item details, and revisit everything you
            have purchased.
          </p>
        </div>

        <Link
          href="/collections"
          className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium"
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
        <div className="space-y-6">
          {orders.map((order) => {
            const canCancel = isOrderCancelable(order.order_status);

            return (
            <div
              key={order.id}
              className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_20px_50px_rgba(51,33,11,0.08)]"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{order.order_number}</h2>
                    <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                      {getStatusLabel(order.order_status)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-black/60">
                    <span>
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                    <span>Payment: {order.payment_method?.toUpperCase()}</span>
                    <span>{order.order_items?.length || 0} item(s)</span>
                    {order.tracking_number ? (
                      <span>Tracking: {order.tracking_number}</span>
                    ) : null}
                  </div>
                </div>

                <div className="text-left xl:text-right">
                  <p className="text-sm text-black/50">Order Total</p>
                  <p className="mt-1 text-3xl font-bold">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              </div>

              {!!order.order_items?.length && (
                <div className="mt-6 border-t border-black/10 pt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold">Items in this order</h3>
                    <p className="text-sm text-black/55">
                      Detailed product view
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {order.order_items.map((item) => {
                      const productSlug = item.products?.slug;

                      return (
                        <div
                          key={item.id}
                          className="grid gap-4 rounded-[1.5rem] border border-black/10 bg-white p-4 md:grid-cols-[92px_1fr_auto]"
                        >
                          <Link
                            href={productSlug ? `/product/${productSlug}` : "#"}
                            onClick={(e) => {
                              if (!productSlug) e.preventDefault();
                            }}
                            className="overflow-hidden rounded-2xl bg-black/5"
                          >
                            <Image
                              src={item.image_url || FALLBACK_IMAGE}
                              alt={item.title}
                              width={92}
                              height={92}
                              className="h-[92px] w-full object-cover"
                            />
                          </Link>

                          <div>
                            {productSlug ? (
                              <Link
                                href={`/product/${productSlug}`}
                                className="text-lg font-semibold hover:underline"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <p className="text-lg font-semibold">{item.title}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2 text-sm text-black/60">
                              <span className="rounded-full bg-black/[0.05] px-3 py-1">
                                Qty: {item.quantity}
                              </span>
                              {item.size ? (
                                <span className="rounded-full bg-black/[0.05] px-3 py-1">
                                  Size: {item.size}
                                </span>
                              ) : null}
                              {item.color ? (
                                <span className="rounded-full bg-black/[0.05] px-3 py-1">
                                  Color: {item.color}
                                </span>
                              ) : null}
                            </div>
                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() => cancelOrderItem(order, item)}
                                disabled={cancellingItemId === item.id}
                                className="mt-3 rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {cancellingItemId === item.id
                                  ? "Cancelling item..."
                                  : "Cancel This Product"}
                              </button>
                            ) : null}
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-sm text-black/50">Unit Price</p>
                            <p className="mt-1 text-lg font-semibold">
                              {formatPrice(item.price)}
                            </p>
                            <p className="mt-2 text-sm text-black/55">
                              Total{" "}
                              {formatPrice(
                                Number(item.price || 0) * Number(item.quantity || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/orders/${order.order_number}`}
                  className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium"
                >
                  View Full Details
                </Link>
                <Link
                  href={`/track-order?order=${order.order_number}`}
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
                >
                  Track Order
                </Link>
                {canCancel ? (
                  <button
                    type="button"
                    onClick={() => cancelOrder(order)}
                    disabled={cancellingId === order.id}
                    className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                  </button>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-3xl border border-black/10 bg-white p-8">
            Loading orders...
          </div>
        </main>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
