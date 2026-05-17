"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

const initialForm = {
  title: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  image_url: "",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchBanners() {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error(error.message || "Failed to fetch banners");
      return;
    }

    setBanners(data || []);
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  function changeHandler(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function saveBanner(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } = editingId
        ? await supabase.from("banners").update(form).eq("id", editingId)
        : await supabase.from("banners").insert({
            ...form,
            is_active: true,
            sort_order: banners.length,
          });

      if (error) throw error;

      toast.success(editingId ? "Banner updated" : "Banner added");
      resetForm();
      fetchBanners();
    } catch (error) {
      toast.error(error.message || "Failed to save banner");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      image_url: banner.image_url || "",
    });
  }

  async function toggleBanner(id, isActive) {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Failed to update banner");
      return;
    }

    toast.success("Banner updated");
    fetchBanners();
  }

  async function deleteBanner(id) {
    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      toast.error(error.message || "Failed to delete banner");
      return;
    }

    toast.success("Banner deleted");
    fetchBanners();
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
              <h1 className="mt-2 text-4xl font-bold">Banners</h1>
            </div>

            <form
              onSubmit={saveBanner}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold">
                  {editingId ? "Edit Banner" : "Add Banner"}
                </h2>
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
                  name="title"
                  value={form.title}
                  onChange={changeHandler}
                  placeholder="Banner title"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="text"
                  name="button_text"
                  value={form.button_text}
                  onChange={changeHandler}
                  placeholder="Button text"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="text"
                  name="button_link"
                  value={form.button_link}
                  onChange={changeHandler}
                  placeholder="Button link"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={changeHandler}
                  placeholder="Image URL"
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
                <textarea
                  name="subtitle"
                  value={form.subtitle}
                  onChange={changeHandler}
                  placeholder="Subtitle"
                  rows={4}
                  className="rounded-2xl border border-black/10 px-4 py-3 outline-none md:col-span-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-2xl bg-black px-6 py-3 font-medium text-white"
              >
                {loading
                  ? editingId
                    ? "Saving..."
                    : "Adding..."
                  : editingId
                    ? "Save Banner"
                    : "Add Banner"}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{banner.title}</h3>
                  <p className="mt-1 text-sm text-black/60">{banner.subtitle}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => startEditing(banner)}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleBanner(banner.id, banner.is_active)}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm"
                    >
                      {banner.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!banners.length && (
                <div className="rounded-3xl border border-black/10 bg-white p-8">
                  No banners found.
                </div>
              )}
            </div>
          </section>
        </div>
      </AdminGuard>
    </main>
  );
}
