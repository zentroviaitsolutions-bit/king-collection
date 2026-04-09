"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { ORDER_STATUSES } from "@/lib/helpers/orderStatus";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ UPDATED FUNCTION
  async function updateStatus(
    orderId,
    status,
    paymentMethod,
    paymentStatus
  ) {
    try {
      const payload = {
        order_status: status,
        updated_at: new Date().toISOString(),
      };

      // ✅ COD auto paid when delivered
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
              <h1 className="mt-2 text-4xl font-bold">Orders</h1>
            </div>

            <div className="space-y-5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {order.order_number}
                      </h2>
                      <p className="mt-1 text-sm text-black/60">
                        {order.full_name} · {order.phone}
                      </p>
                      <p className="text-sm text-black/60">
                        {order.city}, {order.state}
                      </p>
                    </div>

                    <div className="min-w-[220px]">
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
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-black/5 p-4">
                      <p className="text-sm text-black/50">Amount</p>
                      <p className="mt-1 text-lg font-semibold">
                        ₹{order.total_amount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/5 p-4">
                      <p className="text-sm text-black/50">Payment</p>
                      <p className="mt-1 text-lg font-semibold capitalize">
                        {order.payment_method} / {order.payment_status}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/5 p-4">
                      <p className="text-sm text-black/50">Address</p>
                      <p className="mt-1 text-sm font-medium">
                        {order.address_line1}
                      </p>
                    </div>
                  </div>

                  {!!order.order_items?.length && (
                    <div className="mt-5 space-y-3 border-t border-black/10 pt-5">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-2xl bg-black/5 p-4"
                        >
                          <div>
                            <p className="font-medium">{item.title}</p>

                            <p className="text-sm text-black/60">
                              Qty: {item.quantity}
                              {item.size ? ` · Size: ${item.size}` : ""}
                              {item.color ? ` · Color: ${item.color}` : ""}
                            </p>
                          </div>

                          <p className="font-semibold">₹{item.price}</p>
                        </div>
                      ))}
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
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}