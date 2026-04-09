"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/helpers/slugify";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message || "Failed to fetch categories");
      return;
    }

    setCategories(data || []);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function addCategory(e) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("categories").insert({
        name: name.trim(),
        slug: slugify(name),
      });

      if (error) throw error;

      toast.success("Category created");
      setName("");
      fetchCategories();
    } catch (error) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error(error.message || "Failed to delete category");
      return;
    }

    toast.success("Category deleted");
    fetchCategories();
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
              <h1 className="mt-2 text-4xl font-bold">Categories</h1>
            </div>

            <form
              onSubmit={addCategory}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold">Add Category</h2>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-black px-6 py-3 font-medium text-white"
                >
                  {loading ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>

            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">All Categories</h2>

              <div className="mt-6 space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-2xl border border-black/10 p-4"
                  >
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-black/60">{category.slug}</p>
                    </div>

                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {!categories.length && (
                  <p className="text-black/60">No categories found.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}