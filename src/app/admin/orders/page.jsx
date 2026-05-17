"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import {
  ORDER_STATUSES,
  getStatusLabel,
} from "@/lib/helpers/orderStatus";
import { formatPrice } from "@/lib/helpers/formatPrice";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});

  async function fetchOrders() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(slug))")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      setDrafts(
        Object.fromEntries(
          (data || []).map((order) => [
            order.id,
            {
              tracking_number: order.tracking_number || "",
              payment_status: order.payment_status || "pending",
            },
          ])
        )
      );
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(orderId, status, paymentMethod, paymentStatus) {
    try {
      const payload = {
        order_status: status,
        updated_at: new Date().toISOString(),
      };

      if (
        status === "delivered" &&
        paymentMethod === "cod" &&
        paymentStatus !== "paid"
      ) {
        payload.payment_status = "paid";
      }

      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  }

  function updateDraft(orderId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
  }

  async function saveProcessingDetails(orderId) {
    const draft = drafts[orderId] || {};

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_number: draft.tracking_number?.trim() || null,
          payment_status: draft.payment_status || "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order processing details updated");
      fetchOrders();
    } catch (error) {
      toast.error(error.message || "Failed to save processing details");
    }
  }

  const summary = useMemo(() => {
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      ),
      pendingOrders: orders.filter(
        (order) => order.order_status !== "delivered"
      ).length,
    };
  }, [orders]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <AdminGuard>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />

          <section>
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-black/50">
                Admin
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold">Orders</h1>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-black/10 bg-white/85 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-black/45">
                  Total Orders
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {summary.totalOrders}
                </p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white/85 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-black/45">
                  Revenue
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatPrice(summary.totalRevenue)}
                </p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white/85 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-black/45">
                  Active Orders
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {summary.pendingOrders}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
                Loading orders...
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_20px_50px_rgba(51,33,11,0.08)]"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold">
                            {order.order_number}
                          </h2>
                          <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                            {getStatusLabel(order.order_status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-black/60">
                          {order.full_name} · {order.phone}
                        </p>
                        <p className="text-sm text-black/60">{order.email}</p>
                        <p className="mt-1 text-sm text-black/60">
                          {new Date(order.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="min-w-[240px]">
                        <label className="mb-2 block text-sm font-medium">
                          Update Status
                        </label>
                        <select
                          value={order.order_status}
                          onChange={(e) =>
                            updateStatus(
                              order.id,
                              e.target.value,
                              order.payment_method,
                              order.payment_status
                            )
                          }
                          className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-black/[0.04] p-4">
                        <p className="text-sm text-black/50">Amount</p>
                        <p className="mt-1 text-lg font-semibold">
                          {formatPrice(order.total_amount)}
                        </p>
                        <p className="mt-1 text-sm text-black/55">
                          Subtotal {formatPrice(order.subtotal || 0)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/[0.04] p-4">
                        <p className="text-sm text-black/50">Payment</p>
                        <p className="mt-1 text-lg font-semibold capitalize">
                          {order.payment_method} / {order.payment_status}
                        </p>
                        <p className="mt-1 text-sm text-black/55">
                          Coupon: {order.coupon_code || "No coupon"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/[0.04] p-4">
                        <p className="text-sm text-black/50">Shipping</p>
                        <p className="mt-1 text-sm font-medium leading-6">
                          {order.address_line1}
                          {order.address_line2 ? `, ${order.address_line2}` : ""}
                        </p>
                        <p className="text-sm text-black/55">
                          {order.city}, {order.state} {order.postal_code}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/[0.04] p-4">
                        <p className="text-sm text-black/50">Notes</p>
                        <p className="mt-1 text-sm font-medium leading-6">
                          {order.notes || "No customer notes"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">
                            Processing Details
                          </h3>
                          <p className="mt-1 text-sm text-black/60">
                            Update tracking and payment so customers can see the
                            latest order progress.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => saveProcessingDetails(order.id)}
                          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
                        >
                          Save Processing Info
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={drafts[order.id]?.tracking_number || ""}
                            onChange={(e) =>
                              updateDraft(
                                order.id,
                                "tracking_number",
                                e.target.value
                              )
                            }
                            placeholder="Add tracking number"
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Payment Status
                          </label>
                          <select
                            value={drafts[order.id]?.payment_status || "pending"}
                            onChange={(e) =>
                              updateDraft(
                                order.id,
                                "payment_status",
                                e.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {!!order.order_items?.length && (
                      <div className="mt-6 border-t border-black/10 pt-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <h3 className="text-xl font-semibold">Order Items</h3>
                          <p className="text-sm text-black/55">
                            {order.order_items.length} item
                            {order.order_items.length === 1 ? "" : "s"}
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
                                </div>

                                <div className="text-left md:text-right">
                                  <p className="text-sm text-black/50">Unit Price</p>
                                  <p className="mt-1 text-lg font-semibold">
                                    {formatPrice(item.price)}
                                  </p>
                                  <p className="mt-2 text-sm text-black/55">
                                    Total {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {!orders.length && (
                  <div className="rounded-3xl border border-black/10 bg-white p-8">
                    No orders found.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}
