"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { ORDER_STATUSES, getStatusLabel } from "@/lib/helpers/orderStatus";

const ORDER_STATUS_DESCRIPTIONS = {
  placed: "We received your order and started processing it.",
  confirmed: "Your order details and payment are confirmed.",
  packed: "Your items are packed and ready to leave our facility.",
  shipped: "Your package is on the way with the delivery partner.",
  out_for_delivery: "The package is with the courier for final delivery.",
  delivered: "The order has been delivered successfully.",
};

function TrackOrderPageContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [inputValue, setInputValue] = useState(initialOrder);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentStatusIndex = useMemo(() => {
    if (!order?.order_status) return -1;
    return ORDER_STATUSES.indexOf(order.order_status);
  }, [order]);

  useEffect(() => {
    if (initialOrder) {
      fetchOrder(initialOrder);
    }
  }, [initialOrder]);

  async function fetchOrder(customOrderNumber) {
    const finalOrderNumber = (customOrderNumber || inputValue).trim();

    if (!finalOrderNumber) {
      toast.error("Enter an order number");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", finalOrderNumber)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setOrder(null);
        toast.error("Order not found");
        return;
      }

      setOrder(data);
      setOrderNumber(finalOrderNumber);
    } catch (error) {
      toast.error(error.message || "Failed to track order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Track Order
        </p>
        <h1 className="mt-2 text-4xl font-bold">Track Your Order</h1>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium">Order Number</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            placeholder="Enter order number"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
          />
          <button
            onClick={() => fetchOrder()}
            disabled={loading}
            className="rounded-2xl bg-black px-6 py-3 font-medium text-white"
          >
            {loading ? "Checking..." : "Track Now"}
          </button>
        </div>
      </div>

      {order && (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-black/50">Order Number</p>
                <h2 className="text-2xl font-semibold">{order.order_number}</h2>
                <p className="mt-2 text-sm text-black/60">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-black/50">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatPrice(order.total_amount)}
                </p>
                <p className="mt-2 text-sm font-medium text-black/70">
                  {getStatusLabel(order.order_status)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-semibold">Order Timeline</h3>

            <div className="mt-6">
              <div className="hidden grid-cols-6 gap-3 lg:grid">
                {ORDER_STATUSES.filter((status) => status !== "cancelled").map(
                  (status, index, filteredStatuses) => {
                    const completed = index < currentStatusIndex;
                    const current = index === currentStatusIndex;
                    const reached = completed || current;
                    const isLast = index === filteredStatuses.length - 1;

                    return (
                      <div key={status} className="relative">
                        {!isLast ? (
                          <div
                            className={`absolute left-[calc(50%+18px)] top-[18px] h-[3px] w-[calc(100%-8px)] ${
                              completed ? "bg-black" : "bg-black/10"
                            }`}
                          />
                        ) : null}

                        <div className="relative rounded-[1.5rem] border border-black/10 bg-black/[0.02] p-4">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                              reached
                                ? "border-black bg-black text-white"
                                : "border-black/15 bg-white text-black/45"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <p className="mt-4 font-semibold">
                            {getStatusLabel(status)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-black/55">
                            {ORDER_STATUS_DESCRIPTIONS[status]}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-black/45">
                            {current
                              ? "Current"
                              : completed
                              ? "Completed"
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="space-y-4 lg:hidden">
                {ORDER_STATUSES.filter((status) => status !== "cancelled").map(
                  (status, index, filteredStatuses) => {
                    const completed = index < currentStatusIndex;
                    const current = index === currentStatusIndex;
                    const reached = completed || current;
                    const isLast = index === filteredStatuses.length - 1;

                    return (
                      <div key={status} className="relative flex items-start gap-4">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                              reached
                                ? "border-black bg-black text-white"
                                : "border-black/15 bg-white text-black/45"
                            }`}
                          >
                            {index + 1}
                          </div>
                          {!isLast ? (
                            <div
                              className={`mt-2 h-14 w-[3px] ${
                                completed ? "bg-black" : "bg-black/10"
                              }`}
                            />
                          ) : null}
                        </div>

                        <div className="flex-1 rounded-[1.5rem] border border-black/10 bg-black/[0.02] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold">{getStatusLabel(status)}</p>
                            <span className="text-xs uppercase tracking-[0.24em] text-black/45">
                              {current
                                ? "Current"
                                : completed
                                ? "Completed"
                                : "Pending"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-black/55">
                            {ORDER_STATUS_DESCRIPTIONS[status]}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {order.order_status === "cancelled" && (
                <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="mt-1 h-4 w-4 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium text-red-700">Order Cancelled</p>
                    <p className="text-sm text-red-600/80">
                      This order is marked as cancelled.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Shipping Details</h3>
              <div className="mt-4 space-y-2 text-sm text-black/70">
                <p className="font-medium text-black">{order.full_name}</p>
                <p>{order.phone}</p>
                <p>{order.email}</p>
                <p>{order.address_line1}</p>
                {order.address_line2 ? <p>{order.address_line2}</p> : null}
                <p>
                  {order.city}, {order.state} - {order.postal_code}
                </p>
                <p>{order.country}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Payment Info</h3>
              <div className="mt-4 space-y-2 text-sm text-black/70">
                <p>
                  <span className="text-black/50">Method:</span>{" "}
                  <span className="font-medium uppercase">
                    {order.payment_method}
                  </span>
                </p>
                <p>
                  <span className="text-black/50">Payment Status:</span>{" "}
                  <span className="font-medium capitalize">
                    {order.payment_status}
                  </span>
                </p>
                <p>
                  <span className="text-black/50">Tracking Number:</span>{" "}
                  <span className="font-medium">
                    {order.tracking_number || "Not assigned yet"}
                  </span>
                </p>
                <p>
                  <span className="text-black/50">Coupon:</span>{" "}
                  <span className="font-medium">
                    {order.coupon_code || "No coupon used"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!order && orderNumber && !loading && (
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold">No order found</h2>
          <p className="mt-2 text-black/60">
            Please check the order number and try again.
          </p>
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            Loading order tracker...
          </div>
        </main>
      }
    >
      <TrackOrderPageContent />
    </Suspense>
  );
}
