"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  const [saving, setSaving] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    async function fetchAddress() {
      if (!user) return;

      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (data) {
        setAddress({
          full_name: data.full_name || "",
          phone: data.phone || "",
          line1: data.line1 || "",
          line2: data.line2 || "",
          city: data.city || "",
          state: data.state || "",
          postal_code: data.postal_code || "",
          country: data.country || "India",
        });
      }
    }

    fetchAddress();
  }, [user]);

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

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: form.full_name,
        phone: form.phone,
        avatar_url: form.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

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

      const { data: existing } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("addresses")
          .update({
            ...address,
          })
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
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-8">
          Loading profile...
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
        <h1 className="mt-2 text-4xl font-bold">Profile</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
                {(form.full_name || user.email || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  {form.full_name || "Your Profile"}
                </h2>
                <p className="text-sm text-black/60">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl bg-black/5 p-4">
                <p className="text-black/50">Account Email</p>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>

              <div className="rounded-2xl bg-black/5 p-4">
                <p className="text-black/50">Phone</p>
                <p className="mt-1 font-medium">{form.phone || "Not added yet"}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 w-full rounded-2xl border border-red-200 px-4 py-3 font-medium text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>

          <form
            onSubmit={saveAddress}
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold">Default Address</h2>

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

        <form
          onSubmit={saveProfile}
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8"
        >
          <h2 className="text-2xl font-semibold">Update Profile</h2>

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
                placeholder="Enter your phone number"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Avatar URL</label>
              <input
                type="text"
                name="avatar_url"
                value={form.avatar_url}
                onChange={changeHandler}
                placeholder="Paste avatar image URL"
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}