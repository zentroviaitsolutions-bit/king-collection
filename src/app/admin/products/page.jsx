"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/helpers/slugify";
import { uploadProductImage } from "@/lib/helpers/uploadImage";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

/* ---------------- HELPERS ---------------- */

const normalizeColor = (c) =>
  c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : "";

const safeNumber = (val, fallback = 0) => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

const initialForm = {
  title: "",
  description: "",
  price: "",
  compare_at_price: "",
  brand: "",
  stock: "",
  status: "active",
  category_id: "",
  featured: false,
};

const initialVariant = {
  size: "",
  color: "",
  price: "",
  stock: "",
  images: [],
  is_default: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [variants, setVariants] = useState([{ ...initialVariant }]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) return toast.error(error.message);
    setProducts(data || []);
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) return toast.error(error.message);
    setCategories(data || []);
  }

  /* ---------------- FORM ---------------- */

  function changeHandler(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* ---------------- VARIANTS ---------------- */

  function changeVariant(i, field, value) {
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              [field]:
                field === "color" ? normalizeColor(value) : value,
            }
          : v
      )
    );
  }

  function setDefaultVariant(i) {
    setVariants((prev) =>
      prev.map((v, idx) => ({
        ...v,
        is_default: idx === i,
      }))
    );
  }

  function addVariant() {
    setVariants((p) => [...p, { ...initialVariant }]);
  }

  /* ---------------- IMAGE ---------------- */

  async function handleMainImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadProductImage(file);
      if (!url) throw new Error("Upload failed");

      setMainImage(url);
      toast.success("Main image uploaded");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleVariantUpload(files, index) {
    const urls = [];

    for (let file of files) {
      try {
        const url = await uploadProductImage(file);
        if (url) urls.push(url);
      } catch {
        toast.error("Image upload failed");
      }
    }

    setVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, images: [...v.images, ...urls] } : v
      )
    );
  }

  /* ---------------- VALIDATION ---------------- */

  function validate() {
    if (!form.title) {
      toast.error("Title required");
      return false;
    }

    const map = {};

    for (let v of variants) {
      if (!v.color) continue;
      if (!map[v.color]) map[v.color] = false;
      if (v.images.length) map[v.color] = true;
    }

    for (let c in map) {
      if (!map[c]) {
        toast.error(`Color ${c} needs image`);
        return false;
      }
    }

    return true;
  }

  /* ---------------- SAVE ---------------- */

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const slug = `${slugify(form.title)}-${Date.now()}`;

      /* ---- PRODUCT ---- */
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          ...form,
          slug,
          category_id: form.category_id || null,
          price: safeNumber(form.price),
          compare_at_price: form.compare_at_price
            ? safeNumber(form.compare_at_price)
            : null,
          stock: safeNumber(form.stock),
        })
        .select()
        .single();

      if (productError) throw productError;

      /* ---- MAIN IMAGE ---- */
      if (mainImage) {
        const { error } = await supabase.from("product_images").insert({
          product_id: product.id,
          image_url: mainImage,
        });

        if (error) throw error;
      }

      /* ---- VARIANTS ---- */
      for (let v of variants) {
        const { data: variant, error: variantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: product.id,
            size: v.size || null,
            color: v.color || null,
            price: safeNumber(v.price),
            stock: safeNumber(v.stock),
            is_default: v.is_default,
          })
          .select()
          .single();

        if (variantError) throw variantError;

        if (v.images.length) {
          const { error } = await supabase.from("variant_images").insert(
            v.images.map((img) => ({
              variant_id: variant.id,
              image_url: img,
            }))
          );

          if (error) throw error;
        }
      }

      toast.success("Product saved 🔥");

      setForm(initialForm);
      setVariants([{ ...initialVariant }]);
      setMainImage("");

      fetchProducts();
    } catch (err) {
      console.error("SAVE ERROR:", err);
      toast.error(err.message || "Error saving product");
    }

    setLoading(false);
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
      <AdminGuard>
        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          <AdminSidebar />

          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h1 className="text-3xl font-bold mb-8">Products</h1>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* FORM */}
              <div className="grid gap-5">
                <input name="title" placeholder="Title" onChange={changeHandler} className="input" />

                <textarea name="description" placeholder="Description"
                  onChange={changeHandler} className="input h-28" />

                <div className="grid grid-cols-2 gap-4">
                  <input name="price" placeholder="Price" onChange={changeHandler} className="input" />
                  <input name="compare_at_price" placeholder="Compare Price" onChange={changeHandler} className="input" />
                </div>

                <input name="stock" placeholder="Stock" onChange={changeHandler} className="input" />

                <select name="category_id" onChange={changeHandler} className="input">
                  <option value="">Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* ✅ FEATURED OPTION RESTORED */}
                <label className="flex items-center justify-between bg-gray-100 p-3 rounded-xl">
                  <span className="font-medium">Featured Product</span>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={changeHandler}
                  />
                </label>

                <input type="file" onChange={handleMainImage} className="input" />
              </div>

              {/* VARIANTS */}
              {variants.map((v, i) => (
                <div key={i} className="border p-5 rounded-xl space-y-3">
                  <input placeholder="Size" onChange={(e)=>changeVariant(i,"size",e.target.value)} className="input"/>
                  <input placeholder="Color" onChange={(e)=>changeVariant(i,"color",e.target.value)} className="input"/>
                  <input placeholder="Price" onChange={(e)=>changeVariant(i,"price",e.target.value)} className="input"/>
                  <input placeholder="Stock" onChange={(e)=>changeVariant(i,"stock",e.target.value)} className="input"/>

                  <input type="file" multiple onChange={(e)=>handleVariantUpload(e.target.files,i)} />

                  <button type="button" onClick={()=>setDefaultVariant(i)}>
                    {v.is_default ? "Default" : "Make Default"}
                  </button>
                </div>
              ))}

              <button type="button" onClick={addVariant}>+ Add Variant</button>

              <button className="bg-black text-white px-6 py-3 rounded-xl">
                {loading ? "Saving..." : "Save Product"}
              </button>

            </form>
          </div>
        </div>
      </AdminGuard>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
        }
      `}</style>
    </main>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { supabase } from "@/lib/supabase/client";
// import { slugify } from "@/lib/helpers/slugify";
// import { uploadProductImage } from "@/lib/helpers/uploadImage";
// import AdminGuard from "@/components/admin/AdminGuard";
// import AdminSidebar from "@/components/admin/AdminSidebar";

// const initialForm = {
//   title: "",
//   description: "",
//   price: "",
//   compare_at_price: "",
//   image_url: "",
//   brand: "",
//   stock: "",
//   status: "active",
//   category_id: "",
//   featured: false,
// };

// const initialVariant = {
//   size: "",
//   color: "",
//   price: "",
//   stock: "",
//   image_url: "",
//   is_default: false,
// };

// export default function AdminProductsPage() {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [form, setForm] = useState(initialForm);
//   const [variants, setVariants] = useState([{ ...initialVariant }]);
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // ✅ NEW (per variant upload state)
//   const [uploadingIndex, setUploadingIndex] = useState(null);

//   async function fetchProducts() {
//     try {
//       const { data, error } = await supabase
//         .from("products")
//         .select("*, product_images(*), categories(name), product_variants(*)")
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       setProducts(data || []);
//     } catch (error) {
//       toast.error(error.message);
//     }
//   }

//   async function fetchCategories() {
//     const { data } = await supabase
//       .from("categories")
//       .select("*")
//       .order("name", { ascending: true });

//     setCategories(data || []);
//   }

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, []);

//   function changeHandler(e) {
//     const { name, value, type, checked } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   }

//   function changeVariant(index, field, value) {
//     setVariants((prev) =>
//       prev.map((item, i) =>
//         i === index ? { ...item, [field]: value } : item
//       )
//     );
//   }

//   function addVariantRow() {
//     setVariants((prev) => [...prev, { ...initialVariant }]);
//   }

//   function removeVariantRow(index) {
//     setVariants((prev) => prev.filter((_, i) => i !== index));
//   }

//   // ✅ UPDATED: variant image upload
//   async function handleVariantImageUpload(e, index) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       setUploadingIndex(index);
//       const url = await uploadProductImage(file);

//       setVariants((prev) =>
//         prev.map((item, i) =>
//           i === index ? { ...item, image_url: url } : item
//         )
//       );

//       toast.success("Variant image uploaded");
//     } catch (error) {
//       toast.error(error.message || "Upload failed");
//     } finally {
//       setUploadingIndex(null);
//     }
//   }

//   async function handleFileUpload(e) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       const url = await uploadProductImage(file);
//       setForm((prev) => ({ ...prev, image_url: url }));
//       toast.success("Image uploaded");
//     } catch {
//       toast.error("Upload failed");
//     }
//   }

//   function startEdit(product) {
//     setEditingId(product.id);

//     setForm({
//       title: product.title || "",
//       description: product.description || "",
//       price: product.price || "",
//       compare_at_price: product.compare_at_price || "",
//       image_url: product.product_images?.[0]?.image_url || "",
//       brand: product.brand || "",
//       stock: product.stock || "",
//       status: product.status || "active",
//       category_id: product.category_id || "",
//       featured: !!product.featured,
//     });

//     const existingVariants =
//       product.product_variants?.length
//         ? product.product_variants.map((v) => ({
//             id: v.id,
//             size: v.size || "",
//             color: v.color || "",
//             price: v.price || "",
//             stock: v.stock || "",
//             image_url: v.image_url || "",
//             is_default: !!v.is_default,
//           }))
//         : [{ ...initialVariant }];

//     setVariants(existingVariants);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }

//   function resetForm() {
//     setForm(initialForm);
//     setVariants([{ ...initialVariant }]);
//     setEditingId(null);
//   }

//   async function saveVariants(productId) {
//     if (editingId) {
//       await supabase.from("product_variants").delete().eq("product_id", productId);
//     }

//     const cleanVariants = variants.filter(
//       (v) => v.size || v.color || v.price || v.stock
//     );

//     if (!cleanVariants.length) return;

//     const payload = cleanVariants.map((variant, index) => ({
//       product_id: productId,
//       size: variant.size || null,
//       color: variant.color || null,
//       price: variant.price ? Number(variant.price) : null,
//       stock: Number(variant.stock || 0),
//       image_url: variant.image_url || null,
//       is_default: index === 0,
//     }));

//     const { error } = await supabase.from("product_variants").insert(payload);
//     if (error) throw error;
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();

//     if (!form.title || !form.price) {
//       toast.error("Title and price required");
//       return;
//     }

//     try {
//       setLoading(true);

//       let productId;

//       if (editingId) {
//         await supabase
//           .from("products")
//           .update({
//             ...form,
//             price: Number(form.price),
//           })
//           .eq("id", editingId);

//         productId = editingId;
//         toast.success("Updated");
//       } else {
//         const { data } = await supabase
//           .from("products")
//           .insert({
//             ...form,
//             slug: `${slugify(form.title)}-${Date.now()}`,
//             price: Number(form.price),
//           })
//           .select()
//           .single();

//         productId = data.id;
//         toast.success("Added");
//       }

//       await saveVariants(productId);
//       resetForm();
//       fetchProducts();
//     } catch (error) {
//       toast.error(error.message || "Error saving");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function deleteProduct(id) {
//     await supabase.from("products").delete().eq("id", id);
//     toast.success("Deleted");
//     fetchProducts();
//   }

//   async function toggleFeatured(product) {
//     await supabase
//       .from("products")
//       .update({ featured: !product.featured })
//       .eq("id", product.id);

//     fetchProducts();
//   }

//   return (
//     <main className="mx-auto max-w-7xl px-4 py-12">
//       <AdminGuard>
//         <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
//           <AdminSidebar />

//           <section>
//             <h1 className="text-4xl font-bold mb-6">Products</h1>

//             <form onSubmit={handleSubmit} className="p-6 border rounded-2xl">

//               {/* FORM FIELDS SAME AS BEFORE (kept) */}

//               {/* VARIANTS */}
//               <div className="mt-8">
//                 <h3 className="text-xl font-semibold mb-4">Variants</h3>

//                 {variants.map((variant, index) => (
//                   <div key={index} className="grid md:grid-cols-6 gap-3 mb-4">

//                     <input value={variant.size}
//                       onChange={(e)=>changeVariant(index,"size",e.target.value)}
//                       placeholder="Size" />

//                     <input value={variant.color}
//                       onChange={(e)=>changeVariant(index,"color",e.target.value)}
//                       placeholder="Color" />

//                     <input value={variant.price}
//                       onChange={(e)=>changeVariant(index,"price",e.target.value)}
//                       placeholder="Price" />

//                     <input value={variant.stock}
//                       onChange={(e)=>changeVariant(index,"stock",e.target.value)}
//                       placeholder="Stock" />

//                     {/* ✅ IMAGE UPLOAD */}
//                     <div>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e)=>handleVariantImageUpload(e,index)}
//                       />

//                       {uploadingIndex === index && (
//                         <p className="text-xs">Uploading...</p>
//                       )}

//                       {variant.image_url && (
//                         <img
//                           src={variant.image_url}
//                           className="h-12 mt-2 rounded"
//                         />
//                       )}
//                     </div>

//                     <button type="button"
//                       onClick={()=>removeVariantRow(index)}>
//                       Remove
//                     </button>

//                   </div>
//                 ))}
//               </div>

//               <button type="submit">
//                 {loading ? "Saving..." : "Save Product"}
//               </button>
//             </form>

//             {/* PRODUCTS LIST SAME AS ORIGINAL */}
//           </section>
//         </div>
//       </AdminGuard>
//     </main>
//   );
// }