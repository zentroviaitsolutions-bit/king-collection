"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/helpers/isAdmin";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      if (!isAdmin(profile)) {
        router.push("/");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !isAdmin(profile)) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-8">
        Checking admin access...
      </div>
    );
  }

  return children;
}