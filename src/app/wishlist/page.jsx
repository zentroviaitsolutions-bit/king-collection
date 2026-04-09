"use client";

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">
          Wishlist
        </p>
        <h1 className="mt-2 text-4xl font-bold">Saved Products</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold">Your wishlist is empty</h2>
          <p className="mt-2 text-black/60">
            Save products you love and they will appear here.
          </p>
          <Link
            href="/collections"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}