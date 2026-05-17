import Link from "next/link";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PageTransition from "@/components/animations/PageTransition";
import { formatCouponValue, getCouponSummary } from "@/lib/helpers/coupon";
import { formatPrice } from "@/lib/helpers/formatPrice";
import { mapProductRecord } from "@/lib/helpers/productMapper";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const [
    { data: bannerData },
    { data: couponData },
    { data: featuredData },
  ] = await Promise.all([
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select("*, product_images(*), categories(name, slug)")
      .eq("status", "active")
      .eq("featured", true)
      .order("created_at", { ascending: false }),
  ]);

  const banners = bannerData || [];
  const coupons = couponData || [];
  const featuredProducts = (featuredData || []).map(mapProductRecord);

  return (
    <PageTransition>
      <main>
        <Hero />

        {!!coupons.length && (
          <section className="mx-auto max-w-7xl px-4 py-8">
            <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,250,242,0.96),rgba(250,239,220,0.94))] p-6 shadow-[0_24px_60px_rgba(51,33,11,0.08)] md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-black/45">
                    Live Offers
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-bold">
                    Use these coupons while you shop
                  </h2>
                </div>
                <Link
                  href="/collections"
                  className="rounded-full border border-black/10 bg-white/80 px-5 py-2.5 text-sm font-medium"
                >
                  Shop With Offers
                </Link>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="rounded-[1.6rem] border border-black/10 bg-white/85 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-black px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
                        {formatCouponValue(coupon)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.24em] text-black/45">
                        Code
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-bold">{coupon.code}</h3>
                    <p className="mt-2 text-sm leading-6 text-black/65">
                      {getCouponSummary(coupon)}
                    </p>
                    {Number(coupon.min_order_amount || 0) > 0 ? (
                      <p className="mt-4 text-xs text-black/45">
                        Minimum cart value: {formatPrice(coupon.min_order_amount)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {!!banners.length && (
          <section className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid gap-5 lg:grid-cols-2">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#1b120b,#352215)] p-6 text-white shadow-[0_28px_70px_rgba(24,14,6,0.28)] md:p-8"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,204,123,0.24),transparent_30%)]" />
                  <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-amber-200/10 blur-3xl" />

                  <div className="relative flex h-full flex-col justify-between gap-10">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-amber-100/70">
                        Featured Offer
                      </p>
                      <h2 className="mt-3 max-w-md font-serif text-3xl font-bold leading-tight md:text-4xl">
                        {banner.title}
                      </h2>
                      <p className="mt-4 max-w-lg text-sm leading-7 text-stone-200/78 md:text-base">
                        {banner.subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                      {banner.button_text && banner.button_link ? (
                        <Link
                          href={banner.button_link}
                          className="inline-flex rounded-full bg-amber-200 px-5 py-2.5 text-sm font-medium text-stone-950"
                        >
                          {banner.button_text}
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-white/80">
                          Explore the latest drop
                        </span>
                      )}

                      <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-right backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                          King Collection
                        </p>
                        <p className="mt-1 text-sm text-white/75">
                          Premium picks for this week
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <FeaturedProducts initialProducts={featuredProducts} />
      </main>
    </PageTransition>
  );
}
