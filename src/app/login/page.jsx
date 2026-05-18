"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.2 6.9l6.2 5.2C39 36.7 44 31 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    signIn,
    signInWithGoogle,
    requestPasswordReset,
  } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/profile");
    }
  }, [authLoading, user, router]);

  async function submitHandler(e) {
    e.preventDefault();

    try {
      setLoading(true);
      await signIn(form.email.trim(), form.password);
      toast.success("Logged in successfully");
      router.push("/profile");
    } catch (error) {
      const normalizedEmail = form.email.trim().toLowerCase();

      if (user?.email?.toLowerCase() === normalizedEmail) {
        toast.success("You are already signed in");
        router.replace("/profile");
        return;
      }

      toast.error(
        error?.message ||
          "Login failed. If you created this account with Google, use Continue with Google."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast.error(error?.message || "Google login failed");
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email.trim()) {
      toast.error("Enter your email first");
      return;
    }

    try {
      setResetLoading(true);
      const normalizedEmail = form.email.trim().toLowerCase();

      if (user?.email?.toLowerCase() === normalizedEmail) {
        await requestPasswordReset(form.email);
        toast.success(
          "Password reset link sent to your email."
        );
        return;
      }

      await requestPasswordReset(form.email);
      toast.success(
        "If this email is registered, a password reset link has been sent."
      );
    } catch (error) {
      toast.error(error?.message || "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-7xl items-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Welcome Back
        </p>
        <h1 className="mt-2 text-3xl font-bold">Login to your account</h1>
        <p className="mt-2 text-sm text-black/60">
          Continue with Google or sign in using your email and password.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin access:
          <Link href="/admin/login" className="ml-2 font-semibold text-black">
            Login to Admin Panel
          </Link>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 font-medium text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs uppercase tracking-[0.25em] text-black/40">
            or
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={changeHandler}
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || loading || googleLoading}
                className="text-sm font-medium text-black/60 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={changeHandler}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none transition focus:border-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-black">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
