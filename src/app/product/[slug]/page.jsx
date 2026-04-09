"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter, notFound } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaStar, FaHeart, FaBolt } from "react-icons/fa";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/helpers/formatPrice";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { slug } = use(params);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);

  const [wishlist, setWishlist] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);

  /* ---------------- FETCH PRODUCT ---------------- */
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) return setProduct(null);

      setProduct(data);

      const firstVariant = data.product_variants?.[0];
      setSelectedColor(firstVariant?.color || "");
      setSelectedSize(firstVariant?.size || "");
      setActiveImage(
        firstVariant?.image_url || data.product_images?.[0]?.image_url || ""
      );

      setLoading(false);
    }

    load();
  }, [slug]);

  /* ---------------- REVIEWS ---------------- */
  useEffect(() => {
    if (!product) return;

    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .then(({ data }) => setReviews(data || []));
  }, [product]);

  /* ---------------- SIMILAR ---------------- */
  useEffect(() => {
    if (!product) return;

    supabase
      .from("products")
      .select("*")
      .neq("id", product.id)
      .limit(4)
      .then(({ data }) => setSimilar(data || []));
  }, [product]);

  /* ---------------- VARIANT LOGIC ---------------- */
  const colors = useMemo(
    () => [...new Set(product?.product_variants?.map(v => v.color))],
    [product]
  );

  const sizes = useMemo(
    () => [...new Set(product?.product_variants?.map(v => v.size))],
    [product]
  );

  const activeVariant = useMemo(() => {
    return (
      product?.product_variants?.find(
        v => v.color === selectedColor && v.size === selectedSize
      ) ||
      product?.product_variants?.find(v => v.color === selectedColor) ||
      product?.product_variants?.[0]
    );
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    if (activeVariant?.image_url) {
      setActiveImage(activeVariant.image_url);
    }
  }, [activeVariant]);

  const allImages = useMemo(() => {
    const productImgs = product?.product_images?.map(i => i.image_url) || [];
    const variantImgs =
      product?.product_variants?.map(v => v.image_url).filter(Boolean) || [];

    return [...new Set([...variantImgs, ...productImgs])];
  }, [product]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    ).toFixed(1);
  }, [reviews]);

  /* ---------------- REVIEW IMAGE UPLOAD ---------------- */
  async function uploadImages(e) {
    const files = Array.from(e.target.files);
    const urls = [];

    for (let file of files) {
      const path = `reviews/${Date.now()}-${file.name}`;
      await supabase.storage.from("review-images").upload(path, file);
      const { data } = supabase.storage
        .from("review-images")
        .getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    setImages(urls);
  }

  async function submitReview() {
    await supabase.from("reviews").insert([
      { product_id: product.id, rating, comment, images },
    ]);
    toast.success("Review added");
  }

  if (loading)
    return <div className="p-10 animate-pulse h-80 bg-gray-200" />;

  if (!product) return notFound();

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">

      <div className="grid md:grid-cols-2 gap-10">

        {/* IMAGE SECTION */}
        <div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl border overflow-hidden h-[500px] shadow-lg"
          >
            <img src={activeImage} className="w-full h-full object-cover" />
          </motion.div>

          {/* THUMBNAILS */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {allImages.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setActiveImage(img)}
                className={`h-16 w-16 rounded-xl cursor-pointer border-2 transition ${
                  activeImage === img ? "border-black scale-105" : "border-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* INFO */}
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>

          <div className="flex items-center gap-2 mt-2">
            <FaStar className="text-yellow-500" />
            <span>{avgRating}</span>
            <span className="text-gray-500">({reviews.length})</span>
          </div>

          <p className="text-3xl font-bold mt-4">
            {formatPrice(activeVariant?.price || product.price)}
          </p>

          {/* COLORS */}
          <div className="flex gap-3 mt-5 flex-wrap">
            {colors.map(c => {
              const img =
                product.product_variants.find(v => v.color === c)?.image_url;

              return (
                <div
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`cursor-pointer p-1 border rounded-xl ${
                    selectedColor === c ? "border-black" : "border-gray-300"
                  }`}
                >
                  {img ? (
                    <img src={img} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded" style={{ background: c }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* SIZES */}
          <div className="flex gap-2 mt-5">
            {sizes.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`px-4 py-2 border rounded-xl ${
                  selectedSize === s ? "bg-black text-white" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 mt-6 flex-wrap">

            <button
              onClick={() =>
                addToCart({
                  ...product,
                  price: activeVariant?.price,
                  color: selectedColor,
                  size: selectedSize,
                  image: activeVariant?.image_url,
                })
              }
              className="flex-1 bg-black text-white py-3 rounded-xl"
            >
              Add to Cart
            </button>

            <button
              onClick={() => {
                addToCart({
                  ...product,
                  price: activeVariant?.price,
                });
                router.push("/checkout");
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 rounded-xl"
            >
              <FaBolt /> Buy Now
            </button>

            <button
              onClick={() => setWishlist(!wishlist)}
              className={`p-3 rounded-xl border ${
                wishlist ? "bg-red-500 text-white" : ""
              }`}
            >
              <FaHeart />
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>

        <textarea
          className="w-full border p-3 rounded-xl"
          placeholder="Write review..."
          onChange={e => setComment(e.target.value)}
        />

        <input type="file" multiple onChange={uploadImages} />

        <button
          onClick={submitReview}
          className="bg-black text-white px-6 py-2 mt-3 rounded-xl"
        >
          Submit Review
        </button>

        {reviews.map(r => (
          <div key={r.id} className="border-b py-4">
            <p>⭐ {r.rating}</p>
            <p>{r.comment}</p>

            <div className="flex gap-2 mt-2">
              {r.images?.map((img, i) => (
                <img key={i} src={img} className="h-16 w-16 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SIMILAR */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {similar.map(p => (
          <div
            key={p.id}
            onClick={() => router.push(`/product/${p.slug}`)}
            className="cursor-pointer border p-3 rounded-xl hover:shadow-lg"
          >
            <p className="font-medium">{p.title}</p>
          </div>
        ))}
      </div>
    </main>
  );
}