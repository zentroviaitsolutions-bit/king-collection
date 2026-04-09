"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/helpers/isAdmin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, user, profile } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isAdmin(profile)) {
      router.push("/admin");
    }
  }, [user, profile, router]);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submitHandler(e) {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await signIn(form.email, form.password);

      if (!result?.user) {
        throw new Error("Login failed");
      }

      toast.success("Logged in successfully");
      router.push("/admin");
    } catch (error) {
      toast.error(error.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-7xl items-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Admin Panel
        </p>
        <h1 className="mt-2 text-3xl font-bold">Admin Login</h1>

        <form onSubmit={submitHandler} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={changeHandler}
              placeholder="Enter admin email"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={changeHandler}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </main>
  );
}