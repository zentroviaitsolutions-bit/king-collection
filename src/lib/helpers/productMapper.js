const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

export function mapProductRecord(item) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    category_id: item.category_id || null,
    price: item.price,
    compare_at_price: item.compare_at_price,
    image: item.product_images?.[0]?.image_url || FALLBACK_IMAGE,
    category: item.categories?.name || item.brand || "Collection",
    categorySlug: item.categories?.slug || "uncategorized",
    featured: item.featured,
  };
}

export { FALLBACK_IMAGE };
