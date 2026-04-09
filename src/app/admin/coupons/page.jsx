"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

const initialForm = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: "",
  max_discount: "",
  usage_limit: "",
  per_user_limit: "1",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  async function fetchCoupons() {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message || "Failed to fetch coupons");
      return;
    }

    setCoupons(data || []);
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function addCoupon(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value || 0),
        min_order_amount: Number(form.min_order_amount || 0),
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_user_limit: Number(form.per_user_limit || 1),
        is_active: true,
      });

      if (error) throw error;

      toast.success("Coupon created");
      setForm(initialForm);
      fetchCoupons();
    } catch (error) {
      toast.error(error.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  }

  async function toggleCoupon(id, isActive) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Failed to update coupon");
      return;
    }

    toast.success("Coupon updated");
    fetchCoupons();
  }

  async function deleteCoupon(id) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      toast.error(error.message || "Failed to delete coupon");
      return;
    }

    toast.success("Coupon deleted");
    fetchCoupons();
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
              <h1 className="mt-2 text-4xl font-bold">Coupons</h1>
            </div>

            <form
              onSubmit={addCoupon}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold">Create Coupon</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={changeHandler}
                  placeholder="Coupon code"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <select
                  name="type"
                  value={form.type}
                  onChange={changeHandler}
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input
                  type="number"
                  name="value"
                  value={form.value}
                  onChange={changeHandler}
                  placeholder="Value"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="number"
                  name="min_order_amount"
                  value={form.min_order_amount}
                  onChange={changeHandler}
                  placeholder="Minimum order amount"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="number"
                  name="max_discount"
                  value={form.max_discount}
                  onChange={changeHandler}
                  placeholder="Max discount"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="number"
                  name="usage_limit"
                  value={form.usage_limit}
                  onChange={changeHandler}
                  placeholder="Usage limit"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white"
              >
                {loading ? "Creating..." : "Create Coupon"}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{coupon.code}</h3>
                      <p className="mt-1 text-sm text-black/60">
                        {coupon.type} · {coupon.value} · Min order ₹
                        {coupon.min_order_amount || 0}
                      </p>
                      <p className="text-sm text-black/60">
                        Used: {coupon.used_count || 0} /{" "}
                        {coupon.usage_limit || "∞"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleCoupon(coupon.id, coupon.is_active)}
                        className="rounded-full border border-black/10 px-4 py-2 text-sm"
                      >
                        {coupon.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!coupons.length && (
                <div className="rounded-3xl border border-black/10 bg-white p-8">
                  No coupons found.
                </div>
              )}
            </div>
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}