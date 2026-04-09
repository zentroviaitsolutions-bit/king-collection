"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { demoProducts } from "@/data/demoProducts";
import { supabase } from "@/lib/supabase/client";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), categories(name, slug)")
        .eq("status", "active")
        .eq("featured", true)
        .order("created_at", { ascending: false });

      if (data?.length) {
        const mapped = data.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          description: item.description,
          price: item.price,
          compare_at_price: item.compare_at_price,
          image:
            item.product_images?.[0]?.image_url ||
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
          category: item.categories?.name || "Collection",
          categorySlug: item.categories?.slug || "collection",
          featured: item.featured,
        }));

        setProducts(mapped);
      } else {
        setProducts(demoProducts.filter((item) => item.featured).slice(0, 3));
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Featured
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Best of King Collection
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}