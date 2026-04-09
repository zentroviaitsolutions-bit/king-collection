import { supabase } from "@/lib/supabase/client";

export async function uploadProductImage(file) {
  if (!file) throw new Error("No file selected");

  const ext = file.name.split(".").pop();
  const fileName = `product-${Date.now()}.${ext}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}