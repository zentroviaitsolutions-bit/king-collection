"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { supabase } from "@/lib/supabase/client";
import PageTransition from "@/components/animations/PageTransition";

export default function HomePage() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    async function fetchBanners() {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setBanners(data || []);
    }

    fetchBanners();
  }, []);

  return (
    <PageTransition>
      <main>
        <Hero />

        {!!banners.length && (
          <section className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid gap-4 md:grid-cols-2">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm uppercase tracking-[0.3em] text-black/50">
                    Offer
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{banner.title}</h2>
                  <p className="mt-3 text-black/60">{banner.subtitle}</p>

                  {banner.button_text && banner.button_link && (
                    <Link
                      href={banner.button_link}
                      className="mt-5 inline-block rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
                    >
                      {banner.button_text}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <FeaturedProducts />
      </main>
    </PageTransition>
  );
}