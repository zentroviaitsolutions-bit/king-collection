"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import PageTransition from "@/components/animations/PageTransition";

export default function CollectionsClient({
  initialProducts,
  initialCategories,
  error = "",
}) {
  const [products] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [activeCategory, setActiveCategory] = useState("all");

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
        <div className="mb-8 rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,246,232,0.92))] p-6 shadow-[0_24px_60px_rgba(51,33,11,0.08)] md:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Collections
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold">Explore Products</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
            Browse the catalog with cleaner filters, faster scanning, and a more
            premium storefront feel.
          </p>
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

        <div className="mb-3 text-sm text-black/55">
          {filteredProducts.length} result
          {filteredProducts.length === 1 ? "" : "s"} found
        </div>

        <div className="mb-8 grid gap-4 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-sm md:grid-cols-[1fr_220px]">
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

        {error ? (
          <div className="mb-8 rounded-3xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        {filteredProducts.length ? (
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
