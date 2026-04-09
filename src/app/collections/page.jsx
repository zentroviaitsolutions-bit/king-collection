"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { demoProducts } from "@/data/demoProducts";
import { supabase } from "@/lib/supabase/client";
import PageTransition from "@/components/animations/PageTransition";

export default function CollectionsPage() {
  const [products, setProducts] = useState(demoProducts);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [{ data: productData }, { data: categoryData }] = await Promise.all([
        supabase
          .from("products")
          .select("*, product_images(*), categories(name, slug)")
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name", { ascending: true }),
      ]);

      if (productData?.length) {
        const mapped = productData.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          description: item.description,
          price: item.price,
          compare_at_price: item.compare_at_price,
          image:
            item.product_images?.[0]?.image_url ||
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
          category: item.categories?.name || item.brand || "Collection",
          categorySlug: item.categories?.slug || "uncategorized",
          featured: item.featured,
        }));

        setProducts(mapped);
      }

      setCategories(categoryData || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (activeCategory !== "all") {
      data = data.filter((item) => item.categorySlug === activeCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-low") {
      data.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      data.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return data;
  }, [products, query, sortBy, activeCategory]);

  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Collections
          </p>
          <h1 className="mt-2 text-4xl font-bold">Explore Products</h1>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-4 py-2 text-sm ${
              activeCategory === "all"
                ? "bg-black text-white"
                : "border border-black/10 bg-white"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.slug)}
              className={`rounded-full px-4 py-2 text-sm ${
                activeCategory === category.slug
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-4 rounded-3xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
          >
            <option value="latest">Latest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredProducts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold">No products found</h2>
            <p className="mt-2 text-black/60">
              Try a different search or filter.
            </p>
          </div>
        )}
      </main>
    </PageTransition>
  );
}