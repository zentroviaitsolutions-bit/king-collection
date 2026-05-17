import CollectionsClient from "@/components/collections/CollectionsClient";
import { demoProducts } from "@/data/demoProducts";
import { mapProductRecord } from "@/lib/helpers/productMapper";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CollectionsPage() {
  const supabase = createServerSupabaseClient();
  let products = demoProducts;
  let categories = [];
  let error = "";

  try {
    const [{ data: productData }, { data: categoryData }] = await Promise.all([
      supabase
        .from("products")
        .select("*, product_images(*), categories(name, slug)")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name", { ascending: true }),
    ]);

    if (productData?.length) {
      products = productData.map(mapProductRecord);
    }

    categories = categoryData || [];
  } catch (err) {
    console.error("Collections fetch failed", err);
    error =
      "Unable to load collections. Please verify your Supabase configuration and try again.";
  }

  return (
    <CollectionsClient
      initialProducts={products}
      initialCategories={categories}
      error={error}
    />
  );
}
