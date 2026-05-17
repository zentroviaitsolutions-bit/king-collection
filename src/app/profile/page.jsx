"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useUserProducts } from "@/context/UserProductContext";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { getStatusLabel } from "@/lib/helpers/orderStatus";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

const initialProfileForm = {
  full_name: "",
  phone: "",
  avatar_url: "",
};

const initialAddressForm = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();
  const { purchasedHistory, recentlyViewed } = useUserProducts();

  const [form, setForm] = useState(initialProfileForm);
  const [address, setAddress] = useState(initialAddressForm);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setPageLoading(false);
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) {
      setPageLoading(false);
      return;
    }

    async function hydratePage() {
      try {
        setPageLoading(true);

        const [{ data: addressData, error: addressError }, { data: ordersData, error: ordersError }] =
          await Promise.all([
            supabase
              .from("addresses")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_default", true)
              .maybeSingle(),
            supabase
              .from("orders")
              .select("id, order_number, total_amount, order_status, created_at")
              .eq("user_id", user.id)
              .neq("order_status", "cancelled")
              .order("created_at", { ascending: false })
              .limit(4),
          ]);

        if (addressError) throw addressError;
        if (ordersError) throw ordersError;

        if (addressData) {
          setAddress({
            full_name: addressData.full_name || "",
            phone: addressData.phone || "",
            line1: addressData.line1 || "",
            line2: addressData.line2 || "",
            city: addressData.city || "",
            state: addressData.state || "",
            postal_code: addressData.postal_code || "",
            country: addressData.country || "India",
          });
        }

        setRecentOrders(ordersData || []);
      } catch (error) {
        toast.error(error.message || "Failed to load profile details");
      } finally {
        setPageLoading(false);
      }
    }

    hydratePage();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setForm({
      full_name: profile?.full_name || user.user_metadata?.full_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    });
  }, [profile, user]);

  const totalSpent = useMemo(
    () =>
      recentOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      ),
    [recentOrders]
  );
  const purchaseHighlights = purchasedHistory.slice(0, 6);
  const viewedHighlights = recentlyViewed.slice(0, 6);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addressChangeHandler(e) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (!user) return;

    try {
      setSaving(true);

      const payload = {
        id: user.id,
        email: user.email,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        avatar_url: form.avatar_url.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(payload);

      if (error) throw error;

      setForm((prev) => ({
        ...prev,
        full_name: payload.full_name,
        phone: payload.phone,
        avatar_url: payload.avatar_url,
      }));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress(e) {
    e.preventDefault();

    if (!user) return;

    try {
      setSavingAddress(true);

      const { data: existing, error: existingError } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error } = await supabase
          .from("addresses")
          .update({ ...address })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert({
          user_id: user.id,
          ...address,
          is_default: true,
        });

        if (error) throw error;
      }

      toast.success("Address saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out");
      router.replace("/login");
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  }

  if (loading || pageLoading || !user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="h-72 animate-pulse rounded-[2rem] bg-black/6" />
          <div className="h-[32rem] animate-pulse rounded-[2rem] bg-black/6" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          My Account
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Profile</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,247,236,0.92))] p-6 shadow-[0_24px_60px_rgba(51,33,11,0.08)]">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 min-h-[72px] min-w-[72px] items-center justify-center rounded-full bg-black text-2xl font-bold text-white">
                {(form.full_name || user.email || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  {form.full_name || "Your Profile"}
                </h2>
                <p className="text-sm text-black/60">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                  Orders
                </p>
                <p className="mt-2 text-2xl font-semibold">{recentOrders.length}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                  Recent Spend
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatPrice(totalSpent)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-black/50">Account Email</p>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-black/50">Phone</p>
                <p className="mt-1 font-medium">{form.phone || "Not added yet"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/orders"
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium"
              >
                View Orders
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Recent Orders</h2>
                <p className="mt-2 text-sm text-black/60">
                  A quick look at your latest activity.
                </p>
              </div>
              <Link href="/orders" className="text-sm font-medium text-black/60">
                See all
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentOrders.length ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.order_number}`}
                    className="block rounded-2xl border border-black/10 bg-black/[0.03] p-4 transition hover:bg-black/[0.05]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{order.order_number}</p>
                        <p className="mt-1 text-sm text-black/60">
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(order.total_amount)}
                        </p>
                        <p className="mt-1 text-sm text-black/60">
                          {getStatusLabel(order.order_status)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-black/60">
                  You have not placed an order yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Purchase History</h2>
                <p className="mt-2 text-sm text-black/60">
                  Products you have already bought, with quick links back to them.
                </p>
              </div>
              <Link href="/orders" className="text-sm font-medium text-black/60">
                Order details
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {purchaseHighlights.length ? (
                purchaseHighlights.map((item) => {
                  const content = (
                    <div className="flex gap-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4 transition hover:bg-black/[0.05]">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-black/5">
                        <Image
                          src={item.image || FALLBACK_IMAGE}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-black/60">
                          {formatPrice(item.price)} · Qty {item.quantity}
                        </p>
                        <p className="mt-1 text-sm text-black/60">
                          {getStatusLabel(item.orderStatus)} · {item.orderNumber}
                        </p>
                        {(item.size || item.color) && (
                          <p className="mt-1 text-xs text-black/45">
                            {[item.size ? `Size ${item.size}` : null, item.color ? `Color ${item.color}` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );

                  return item.slug ? (
                    <Link key={item.id} href={`/product/${item.slug}`}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-black/60">
                  Your purchased products will appear here after your first order.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Recently Viewed</h2>
                <p className="mt-2 text-sm text-black/60">
                  Pick up where you left off while browsing.
                </p>
              </div>
              <Link
                href="/collections"
                className="text-sm font-medium text-black/60"
              >
                Explore more
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {viewedHighlights.length ? (
                viewedHighlights.map((item) => (
                  <Link
                    key={item.id}
                    href={item.slug ? `/product/${item.slug}` : "/collections"}
                    className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 transition hover:bg-black/[0.05]"
                  >
                    <div className="relative h-36 overflow-hidden rounded-2xl bg-black/5">
                      <Image
                        src={item.image || FALLBACK_IMAGE}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-4 line-clamp-1 font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-black/60">
                      {formatPrice(item.price)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-black/40">
                      Viewed {new Date(item.viewedAt).toLocaleDateString("en-IN")}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-black/60 sm:col-span-2">
                  Products you open will start showing up here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <form
            onSubmit={saveProfile}
            className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm md:p-8"
          >
            <h2 className="text-2xl font-semibold">Update Profile</h2>
            <p className="mt-2 text-sm text-black/60">
              Keep your personal details ready for faster checkout.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={changeHandler}
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={changeHandler}
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatar_url"
                  value={form.avatar_url}
                  onChange={changeHandler}
                  placeholder="Paste image URL"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <form
            onSubmit={saveAddress}
            className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold">Default Address</h2>
            <p className="mt-2 text-sm text-black/60">
              This address will be pre-filled during checkout.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                name="full_name"
                value={address.full_name}
                onChange={addressChangeHandler}
                placeholder="Full name"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <input
                type="text"
                name="phone"
                value={address.phone}
                onChange={addressChangeHandler}
                placeholder="Phone"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <input
                type="text"
                name="line1"
                value={address.line1}
                onChange={addressChangeHandler}
                placeholder="Address line 1"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
              />
              <input
                type="text"
                name="line2"
                value={address.line2}
                onChange={addressChangeHandler}
                placeholder="Address line 2"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
              />
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={addressChangeHandler}
                placeholder="City"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <input
                type="text"
                name="state"
                value={address.state}
                onChange={addressChangeHandler}
                placeholder="State"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <input
                type="text"
                name="postal_code"
                value={address.postal_code}
                onChange={addressChangeHandler}
                placeholder="Postal code"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
              <input
                type="text"
                name="country"
                value={address.country}
                onChange={addressChangeHandler}
                placeholder="Country"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingAddress}
              className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white"
            >
              {savingAddress ? "Saving..." : "Save Address"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
