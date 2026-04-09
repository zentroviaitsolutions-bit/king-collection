"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { toggleWishlist, wishlist } = useWishlist();
  const { addToCart } = useCart();

  const liked = wishlist.some((item) => item.id === product.id);

  return (
    <div className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-semibold">{product.title}</h3>
          <button onClick={() => toggleWishlist(product)}>
            <Heart
              size={18}
              className={liked ? "fill-black text-black" : "text-black/60"}
            />
          </button>
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-black/60">
          {product.description}
        </p>

        <div className="mb-4 flex items-center gap-2">
          <span className="font-bold">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-black/40 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <button
          onClick={() => addToCart(product)}
          className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}