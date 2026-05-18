"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, logout } = useAuth();
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submitHandler(e) {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error("Password should be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(form.password);
      await logout();
      toast.success("Password updated successfully");
      router.replace("/login");
    } catch (error) {
      toast.error(error?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-7xl items-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Account Recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-black/60">
          Enter your new password to finish resetting your account access.
        </p>

        <form onSubmit={submitHandler} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">New Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={changeHandler}
              placeholder="Enter new password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={changeHandler}
              placeholder="Confirm new password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Back to{" "}
          <Link href="/login" className="font-medium text-black">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
