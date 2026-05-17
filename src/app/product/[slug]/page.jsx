"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaBolt, FaHeart, FaStar } from "react-icons/fa";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUserProducts } from "@/context/UserProductContext";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { getStatusLabel } from "@/lib/helpers/orderStatus";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { getProductPurchaseState, recordRecentlyViewed } = useUserProducts();
  const slug = params?.slug;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*), product_variants(*)")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setProduct(null);
          return;
        }

        setProduct(data);

        const variants = data.product_variants || [];
        const firstVariant = variants[0] || null;
        const firstProductImage = data.product_images?.[0]?.image_url || null;
        const firstImage =
          firstVariant?.image_url || firstProductImage || FALLBACK_IMAGE;

        setSelectedColor(firstVariant?.color || "");
        setSelectedSize(firstVariant?.size || "");
        setActiveImage(firstImage);
      } catch (error) {
        console.error("Failed to load product", error);
        setProduct(null);
        toast.error(error.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  useEffect(() => {
    async function loadReviews() {
      if (!product?.id) return;

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load reviews", error);
        return;
      }

      setReviews(data || []);
    }

    loadReviews();
  }, [product]);

  useEffect(() => {
    async function loadSimilar() {
      if (!product?.id) return;

      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .neq("id", product.id)
        .limit(4);

      if (error) {
        console.error("Failed to load similar products", error);
        return;
      }

      setSimilar(data || []);
    }

    loadSimilar();
  }, [product]);

  const colors = useMemo(
    () =>
      [...new Set((product?.product_variants || []).map((variant) => variant.color))]
        .filter(Boolean),
    [product]
  );

  const sizes = useMemo(
    () =>
      [...new Set((product?.product_variants || []).map((variant) => variant.size))]
        .filter(Boolean),
    [product]
  );

  const activeVariant = useMemo(() => {
    const variants = product?.product_variants || [];

    return (
      variants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize
      ) ||
      variants.find((variant) => variant.color === selectedColor) ||
      variants.find((variant) => variant.size === selectedSize) ||
      variants[0] ||
      null
    );
  }, [product, selectedColor, selectedSize]);

  const allImages = useMemo(() => {
    const productImages =
      product?.product_images?.map((image) => image.image_url).filter(Boolean) ||
      [];
    const variantImages =
      product?.product_variants
        ?.map((variant) => variant.image_url)
        .filter(Boolean) || [];

    const merged = [...new Set([...variantImages, ...productImages])];
    return merged.length ? merged : [FALLBACK_IMAGE];
  }, [product]);

  const displayImage = activeImage || allImages[0] || FALLBACK_IMAGE;

  useEffect(() => {
    if (!displayImage) return;
    setActiveImage((current) => current || displayImage);
  }, [displayImage]);

  useEffect(() => {
    if (activeVariant?.image_url) {
      setActiveImage(activeVariant.image_url);
    }
  }, [activeVariant]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return "New";

    return (
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      reviews.length
    ).toFixed(1);
  }, [reviews]);

  const displayPrice = Number(activeVariant?.price || product?.price || 0);
  const displayComparePrice = Number(
    activeVariant?.compare_at_price || product?.compare_at_price || 0
  );
  const discountPercent =
    displayComparePrice > displayPrice && displayPrice > 0
      ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
      : 0;
  const stockCount = Number(activeVariant?.stock ?? product?.stock ?? 0);
  const inStock = stockCount > 0 || activeVariant?.stock == null;
  const purchaseState = getProductPurchaseState(product?.id);
  const wishlistActive = product?.id ? isWishlisted(product.id) : false;

  useEffect(() => {
    if (!product?.id) return;

    recordRecentlyViewed({
      id: product.id,
      slug: product.slug,
      title: product.title,
      image: displayImage,
      price: displayPrice,
      category: product.category,
    });
  }, [
    product,
    displayImage,
    displayPrice,
    recordRecentlyViewed,
  ]);

  async function uploadImages(e) {
    const files = Array.from(e.target.files || []);
    const urls = [];

    for (const file of files) {
      const path = `reviews/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("review-images")
        .upload(path, file);

      if (uploadError) {
        toast.error(uploadError.message || "Failed to upload review image");
        return;
      }

      const { data } = supabase.storage.from("review-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    setImages(urls);
  }

  async function submitReview() {
    if (!product?.id) return;
    if (!comment.trim()) {
      toast.error("Please write a review first");
      return;
    }

    const { error } = await supabase.from("reviews").insert([
      {
        product_id: product.id,
        rating,
        comment: comment.trim(),
        images,
      },
    ]);

    if (error) {
      toast.error(error.message || "Failed to submit review");
      return;
    }

    setReviews((prev) => [
      {
        id: `temp-${Date.now()}`,
        rating,
        comment: comment.trim(),
        images,
      },
      ...prev,
    ]);
    setComment("");
    setImages([]);
    toast.success("Review added");
  }

  function buildCartItem() {
    if (!product) return null;

    return {
      ...product,
      variant_id: activeVariant?.id || null,
      stock: activeVariant?.stock ?? product.stock,
      price: activeVariant?.price || product.price,
      color: selectedColor || activeVariant?.color || null,
      size: selectedSize || activeVariant?.size || null,
      image: displayImage,
    };
  }

  function handleAddToCart() {
    const cartItem = buildCartItem();

    if (!cartItem) return;
    if (!inStock) {
      toast.error("This item is currently out of stock");
      return;
    }

    const result = addToCart(cartItem);
    if (result?.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result?.message || "This item could not be added to cart");
  }

  function handleBuyNow() {
    const cartItem = buildCartItem();

    if (!cartItem) return;
    if (!inStock) {
      toast.error("This item is currently out of stock");
      return;
    }

    const result = addToCart(cartItem);
    if (!result?.ok) {
      toast.error(result?.message || "This item could not be added to cart");
      return;
    }

    toast.success(result.message);
    router.push("/checkout");
  }

  function handleWishlist() {
    if (!product) return;

    const result = toggleWishlist({
      ...product,
      image: displayImage,
      price: displayPrice,
      color: selectedColor || activeVariant?.color || null,
      size: selectedSize || activeVariant?.size || null,
    });

    if (result?.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result?.message || "Wishlist could not be updated");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="h-[520px] animate-pulse rounded-[2rem] bg-black/8" />
          <div className="space-y-4">
            <div className="h-6 w-24 animate-pulse rounded-full bg-black/8" />
            <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-black/8" />
            <div className="h-28 w-full animate-pulse rounded-3xl bg-black/8" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-black/45">
            Product
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">
            Product not found
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-black/60">
            This page may have been refreshed while the dev server changed, or the
            product slug no longer exists in your data.
          </p>
          <Link
            href="/collections"
            className="mt-8 inline-flex rounded-full bg-black px-6 py-3 text-white"
          >
            Back to collections
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-black/50">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/collections" className="hover:text-black">
          Collections
        </Link>
        <span>/</span>
        <span className="text-black">{product.title}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/80 shadow-[0_24px_60px_rgba(51,33,11,0.10)]"
          >
            <img
              src={displayImage}
              alt={product.title}
              className="h-[420px] w-full object-cover md:h-[560px]"
            />
          </motion.div>

          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {allImages.map((img, index) => (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  displayImage === img
                    ? "border-black shadow-md"
                    : "border-black/10"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.title} preview ${index + 1}`}
                  className="h-20 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,247,236,0.92))] p-6 shadow-[0_24px_60px_rgba(51,33,11,0.08)] md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                {product.category || "Collection"}
              </span>
              {discountPercent > 0 ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                  Save {discountPercent}%
                </span>
              ) : null}
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  inStock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-5xl">
              {product.title}
            </h1>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <FaStar className="text-amber-500" />
              <span className="font-medium">{avgRating}</span>
              <span className="text-black/50">
                ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-bold">{formatPrice(displayPrice)}</p>
              {displayComparePrice > displayPrice ? (
                <p className="pb-1 text-lg text-black/35 line-through">
                  {formatPrice(displayComparePrice)}
                </p>
              ) : null}
            </div>

            <p className="mt-6 text-base leading-7 text-black/68">
              {product.description || "A refined piece designed for modern, confident dressing."}
            </p>

            {purchaseState.hasActiveOrder ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                You already have this product in an active order.
                {purchaseState.latestStatus ? (
                  <span className="ml-1 font-medium">
                    Current status: {getStatusLabel(purchaseState.latestStatus)}.
                  </span>
                ) : null}
                <span className="ml-1">
                  You can buy it again after the current order is delivered.
                </span>
              </div>
            ) : null}

            {colors.length ? (
              <div className="mt-8">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-black/50">
                  Color
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {colors.map((color) => {
                    const image = product.product_variants?.find(
                      (variant) => variant.color === color
                    )?.image_url;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-2xl border p-1.5 ${
                          selectedColor === color
                            ? "border-black bg-black/5"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={color}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-stone-100 px-3 text-xs font-medium text-black">
                            {color}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {sizes.length ? (
              <div className="mt-8">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-black/50">
                  Size
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || purchaseState.hasActiveOrder}
                className="rounded-2xl bg-black px-6 py-3 font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-black/40"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock || purchaseState.hasActiveOrder}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-200 px-6 py-3 font-medium text-stone-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-amber-100/70"
              >
                <FaBolt />
                Buy Now
              </button>

              <button
                type="button"
                onClick={handleWishlist}
                className={`rounded-2xl border px-4 py-3 ${
                  wishlistActive
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-black/10 bg-white"
                }`}
              >
                <FaHeart />
              </button>
            </div>

            <div className="mt-8 grid gap-3 rounded-3xl bg-white/70 p-4 text-sm text-black/65 sm:grid-cols-3">
              <div>
                <p className="font-medium text-black">Express dispatch</p>
                <p className="mt-1">Packed with care and processed quickly.</p>
              </div>
              <div>
                <p className="font-medium text-black">Easy checkout</p>
                <p className="mt-1">COD supported, Razorpay when configured.</p>
              </div>
              <div>
                <p className="font-medium text-black">Responsive fit help</p>
                <p className="mt-1">Choose variants before adding to cart.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
          <h2 className="font-serif text-3xl font-bold">Leave a review</h2>
          <p className="mt-2 text-sm leading-6 text-black/60">
            Share fit, fabric, and overall impression to help future shoppers.
          </p>

          <div className="mt-5">
            <label className="text-sm font-medium text-black/65">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} Star{value === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            placeholder="Write your review..."
            rows={5}
          />

          <input
            type="file"
            multiple
            onChange={uploadImages}
            className="mt-4 block w-full text-sm text-black/60"
          />

          <button
            type="button"
            onClick={submitReview}
            className="mt-5 rounded-2xl bg-black px-6 py-3 font-medium text-white"
          >
            Submit Review
          </button>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl font-bold">Customer reviews</h2>
            <span className="text-sm text-black/50">
              {reviews.length} total
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-3xl bg-black/4 p-5">
                  <p className="font-medium">{"★".repeat(Number(review.rating || 0))}</p>
                  <p className="mt-2 leading-7 text-black/70">{review.comment}</p>

                  {review.images?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.images.map((img, index) => (
                        <img
                          key={`${img}-${index}`}
                          src={img}
                          alt="Review upload"
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-black/15 p-8 text-center text-black/60">
                No reviews yet. Be the first to share feedback.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-black/45">
              More to explore
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold">
              Similar Products
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((item) => {
            const image =
              item.product_images?.[0]?.image_url || item.image || FALLBACK_IMAGE;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/product/${item.slug}`)}
                className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={image}
                  alt={item.title}
                  className="h-52 w-full object-cover"
                />
                <div className="p-4">
                  <p className="line-clamp-1 font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-black/60">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
