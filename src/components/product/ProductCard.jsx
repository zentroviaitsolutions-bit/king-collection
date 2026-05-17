"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCart } = useCart();

  const liked = isWishlisted(product.id);

  function handleWishlist() {
    const result = toggleWishlist(product);
    if (!result) return;

    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleAddToCart() {
    const result = addToCart(product);
    if (!result) return;

    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-black/10 bg-[linear-gradient(180deg,#ffffff,#fff8ef)] shadow-[0_18px_45px_rgba(51,33,11,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(51,33,11,0.14)]">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="p-4">
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-black/45">
          {product.category}
        </p>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-semibold">{product.title}</h3>
          <button
            onClick={handleWishlist}
            className="rounded-full border border-black/10 bg-white/80 p-2"
          >
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
          onClick={handleAddToCart}
          className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
