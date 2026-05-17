"use client";

import ProductCard from "@/components/product/ProductCard";
import { demoProducts } from "@/data/demoProducts";

export default function FeaturedProducts({ initialProducts = [] }) {
  const products =
    initialProducts.length
      ? initialProducts
      : demoProducts.filter((item) => item.featured).slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-black/50">
            Featured
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            Best of King Collection
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
            A sharper edit of pieces shoppers are most likely to explore first.
          </p>
        </div>

        <div className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-black/60 shadow-sm">
          {`${products.length} featured style${products.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
