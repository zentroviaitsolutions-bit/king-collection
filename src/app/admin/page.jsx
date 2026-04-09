"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [orderData, setOrderData] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: productsCount, error: productsError },
          { count: ordersCount, error: ordersError },
          { data: ordersData, error: revenueError },
          { count: pendingCount, error: pendingError },
        ] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("total_amount, created_at"),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .in("order_status", ["placed", "confirmed", "packed"]),
        ]);

        if (productsError) throw productsError;
        if (ordersError) throw ordersError;
        if (revenueError) throw revenueError;
        if (pendingError) throw pendingError;

        const revenue = (ordersData || []).reduce(
          (sum, item) => sum + Number(item.total_amount || 0),
          0
        );

        setStats({
          products: productsCount || 0,
          orders: ordersCount || 0,
          revenue,
          pendingOrders: pendingCount || 0,
        });

        const grouped = {};
        for (const order of ordersData || []) {
          const label = new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });

          if (!grouped[label]) {
            grouped[label] = { revenue: 0, orders: 0 };
          }

          grouped[label].revenue += Number(order.total_amount || 0);
          grouped[label].orders += 1;
        }

        const labels = Object.keys(grouped);
        setRevenueData(labels.map((label) => ({ label, value: grouped[label].revenue })));
        setOrderData(labels.map((label) => ({ label, value: grouped[label].orders })));
      } catch (error) {
        toast.error(error.message || "Failed to load dashboard stats");
      }
    }

    fetchStats();
  }, []);

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
              <h1 className="mt-2 text-4xl font-bold">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-black/50">Total Products</p>
                <h3 className="mt-2 text-3xl font-bold">{stats.products}</h3>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-black/50">Total Orders</p>
                <h3 className="mt-2 text-3xl font-bold">{stats.orders}</h3>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-black/50">Revenue</p>
                <h3 className="mt-2 text-3xl font-bold">₹{stats.revenue}</h3>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-black/50">Pending Orders</p>
                <h3 className="mt-2 text-3xl font-bold">{stats.pendingOrders}</h3>
              </div>
            </div>

            <div className="mt-8">
              <AnalyticsCharts revenueData={revenueData} orderData={orderData} />
            </div>
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}