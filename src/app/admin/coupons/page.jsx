"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatCouponValue, getCouponSummary } from "@/lib/helpers/coupon";

const initialForm = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: "",
  max_discount: "",
  usage_limit: "",
  per_user_limit: "1",
  category_id: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
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

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error(error.message || "Failed to fetch categories");
      return;
    }

    setCategories(data || []);
  }

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, []);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function buildPayload() {
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value || 0),
      min_order_amount: Number(form.min_order_amount || 0),
      max_discount:
        form.type === "percent" && form.max_discount
          ? Number(form.max_discount)
          : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: Number(form.per_user_limit || 1),
      category_id: form.category_id || null,
    };

    if (!editingId) {
      payload.is_active = true;
    }

    return payload;
  }

  async function saveCoupon(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = buildPayload();
      const query = editingId
        ? supabase.from("coupons").update(payload).eq("id", editingId)
        : supabase.from("coupons").insert(payload);

      let { error } = await query;

      if (
        error?.message?.includes("category_id") &&
        error.message.toLowerCase().includes("column")
      ) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.category_id;

        const retryQuery = editingId
          ? supabase.from("coupons").update(fallbackPayload).eq("id", editingId)
          : supabase.from("coupons").insert(fallbackPayload);

        const retryResult = await retryQuery;
        error = retryResult.error;

        if (!error) {
          toast.success(
            editingId
              ? "Coupon updated. Category filtering was skipped because the coupons table does not have a category_id column yet."
              : "Coupon created. Category filtering was skipped because the coupons table does not have a category_id column yet."
          );
          resetForm();
          fetchCoupons();
          return;
        }
      }

      if (error) throw error;

      toast.success(editingId ? "Coupon updated" : "Coupon created");
      resetForm();
      fetchCoupons();
    } catch (error) {
      if (
        error.message?.includes("category_id") &&
        error.message?.toLowerCase().includes("column")
      ) {
        toast.error(
          "Coupon category support needs a category_id column in your coupons table."
        );
      } else {
        toast.error(error.message || "Failed to save coupon");
      }
    } finally {
      setLoading(false);
    }
  }

  function startEditing(coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || "",
      type: coupon.type || "percent",
      value: String(coupon.value ?? ""),
      min_order_amount: String(coupon.min_order_amount ?? ""),
      max_discount: String(coupon.max_discount ?? ""),
      usage_limit: String(coupon.usage_limit ?? ""),
      per_user_limit: String(coupon.per_user_limit ?? 1),
      category_id: coupon.category_id || "",
    });
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
              onSubmit={saveCoupon}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {editingId ? "Edit Coupon" : "Create Coupon"}
                  </h2>
                  <p className="mt-2 text-sm text-black/60">
                    You can now scope a coupon to all products or a single category.
                  </p>
                </div>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

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
                  <option value="percent">Percentage coupon</option>
                  <option value="fixed">Fixed value coupon</option>
                </select>
                <input
                  type="number"
                  name="value"
                  value={form.value}
                  onChange={changeHandler}
                  placeholder={
                    form.type === "percent"
                      ? "Discount percentage"
                      : "Discount value in rupees"
                  }
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
                  placeholder={
                    form.type === "percent"
                      ? "Maximum discount cap"
                      : "Not used for fixed coupons"
                  }
                  disabled={form.type !== "percent"}
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-black/5"
                />
                <input
                  type="number"
                  name="usage_limit"
                  value={form.usage_limit}
                  onChange={changeHandler}
                  placeholder="Usage limit"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={changeHandler}
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white"
              >
                {loading
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                    ? "Save Coupon"
                    : "Create Coupon"}
              </button>

              <div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm text-black/65">
                Preview:
                <span className="ml-2 font-medium text-black">
                  {form.type === "percent"
                    ? `${form.value || 0}% off`
                    : `₹${form.value || 0} off`}
                </span>
                {Number(form.min_order_amount || 0) > 0 ? (
                  <span className="ml-2">
                    on orders above ₹{Number(form.min_order_amount)}
                  </span>
                ) : null}
                {form.type === "percent" && Number(form.max_discount || 0) > 0 ? (
                  <span className="ml-2">
                    capped at ₹{Number(form.max_discount)}
                  </span>
                ) : null}
              </div>
            </form>

            <div className="mt-8 space-y-4">
              {coupons.map((coupon) => {
                const category = categories.find(
                  (item) => item.id === coupon.category_id
                );

                return (
                <div
                  key={coupon.id}
                  className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{coupon.code}</h3>
                      <p className="mt-1 text-sm text-black/60">
                        {getCouponSummary(coupon)}
                      </p>
                      <p className="text-sm text-black/60">
                        Category: {category?.name || "All categories"}
                      </p>
                      <p className="text-sm text-black/60">
                        Used: {coupon.used_count || 0} /{" "}
                        {coupon.usage_limit || "∞"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(coupon)}
                        className="rounded-full border border-black/10 px-4 py-2 text-sm"
                      >
                        Edit
                      </button>
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
                );
              })}

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
