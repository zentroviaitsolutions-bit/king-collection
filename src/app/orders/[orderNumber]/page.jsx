"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { getRemainingOrderPayload } from "@/lib/helpers/orderCancellation";
import { formatPrice } from "@/lib/helpers/formatPrice";
import {
  getStatusLabel,
  isOrderCancelable,
} from "@/lib/helpers/orderStatus";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params?.orderNumber;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState(null);

  async function fetchOrder() {
    if (!orderNumber) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(slug))")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (error) throw error;

      setOrder(data || null);
    } catch (error) {
      toast.error(error.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  async function cancelOrder() {
    if (!order) return;
    if (!isOrderCancelable(order.order_status)) {
      toast.error("This order can no longer be cancelled.");
      return;
    }

    try {
      setCancelling(true);

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
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Order cancelled successfully");
      router.push("/orders");
    } catch (error) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  async function cancelOrderItem(item) {
    if (!order) return;
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
        .eq("id", order.id);

      if (orderError) throw orderError;

      toast.success("Product cancelled successfully");

      if (!remainingItems.length) {
        router.push("/orders");
        return;
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
              order_items: remainingItems,
            }
          : prev
      );
    } catch (error) {
      toast.error(error.message || "Failed to cancel product");
    } finally {
      setCancellingItemId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
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

  const canCancel = isOrderCancelable(order.order_status);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Order Details
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold">
            {order.order_number}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/orders"
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium"
          >
            Back to Orders
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
              onClick={cancelOrder}
              disabled={cancelling}
              className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_20px_50px_rgba(51,33,11,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                {getStatusLabel(order.order_status)}
              </span>
              <span className="text-sm text-black/55">
                Placed on {new Date(order.created_at).toLocaleString("en-IN")}
              </span>
            </div>

            {canCancel ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                You can cancel this order until it moves beyond packing.
              </p>
            ) : null}

            <h2 className="mt-5 text-2xl font-semibold">Items in this order</h2>

            <div className="mt-5 grid gap-4">
              {order.order_items?.map((item) => {
                const productSlug = item.products?.slug;

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-[1.5rem] border border-black/10 bg-white p-4 md:grid-cols-[110px_1fr_auto]"
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
                        width={110}
                        height={110}
                        className="h-[110px] w-full object-cover"
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
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-black/60">
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
                          onClick={() => cancelOrderItem(item)}
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
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order Summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>{formatPrice(order.subtotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/60">Shipping</span>
                <span>{formatPrice(order.shipping_amount || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/60">Discount</span>
                <span>- {formatPrice(order.discount_amount || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-black/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total_amount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Payment & Delivery</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-black/50">Payment</p>
                <p className="mt-1 font-medium capitalize">
                  {order.payment_method} / {order.payment_status}
                </p>
              </div>
              <div>
                <p className="text-black/50">Coupon</p>
                <p className="mt-1 font-medium">
                  {order.coupon_code || "No coupon used"}
                </p>
              </div>
              <div>
                <p className="text-black/50">Tracking Number</p>
                <p className="mt-1 font-medium">
                  {order.tracking_number || "Not assigned yet"}
                </p>
              </div>
              <div>
                <p className="text-black/50">Shipping Address</p>
                <p className="mt-1 font-medium leading-6">
                  {order.full_name}
                  <br />
                  {order.address_line1}
                  {order.address_line2 ? `, ${order.address_line2}` : ""}
                  <br />
                  {order.city}, {order.state} {order.postal_code}
                  <br />
                  {order.country}
                  <br />
                  {order.phone}
                </p>
              </div>
              <div>
                <p className="text-black/50">Notes</p>
                <p className="mt-1 font-medium">
                  {order.notes || "No notes added"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
