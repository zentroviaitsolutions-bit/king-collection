"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

export default function Hero() {
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    )
      .fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.3"
      )
      .fromTo(
        buttonsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.2"
      );
  }, []);

  return (
    <section className="relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,204,123,0.22),_transparent_28%),linear-gradient(135deg,_#160f09_0%,_#24170c_48%,_#090909_100%)]" />
      <div className="absolute -right-28 top-16 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-full bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.28))]" />

      <div className="relative mx-auto grid min-h-[85vh] max-w-7xl gap-14 px-4 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="flex flex-col justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm uppercase tracking-[0.32em] text-amber-100/70"
        >
          Premium Fashion Store
        </motion.p>

        <h1
          ref={titleRef}
          className="max-w-3xl font-serif text-5xl leading-[0.95] opacity-0 md:text-7xl"
        >
          Dress with presence.
          <span className="block text-amber-200">Own the room quietly.</span>
        </h1>

        <p
          ref={textRef}
          className="mt-6 max-w-2xl text-base leading-7 text-stone-200/78 opacity-0 md:text-lg"
        >
          Discover premium ethnic and modern fashion with a storefront that
          feels refined from the first scroll to the final checkout.
        </p>

        <div ref={buttonsRef} className="mt-8 flex flex-wrap gap-4 opacity-0">
          <Link
            href="/collections"
            className="rounded-full bg-amber-200 px-6 py-3 font-medium text-stone-950 shadow-[0_18px_40px_rgba(255,204,123,0.22)] hover:scale-[1.02] hover:bg-amber-100"
          >
            Shop Now
          </Link>

          <Link
            href="/track-order"
            className="rounded-full border border-white/15 bg-white/6 px-6 py-3 font-medium text-white backdrop-blur-sm hover:bg-white/12"
          >
            Track Order
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Curated Drops", "Premium picks updated frequently"],
            ["Smooth Checkout", "Fast, clear, mobile-friendly purchase flow"],
            ["Order Visibility", "Track every step after payment"],
          ].map(([label, text]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-amber-100/70">
                {label}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-200/72">{text}</p>
            </div>
          ))}
        </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -left-10 top-8 h-28 w-28 rounded-full border border-white/10" />
          <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
            <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-8">
              <p className="text-sm uppercase tracking-[0.32em] text-amber-100/65">
                New Season
              </p>
              <h2 className="mt-4 max-w-sm font-serif text-4xl leading-tight text-white">
                Elevated pieces for festive nights and sharp everyday wear.
              </h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-black/24 p-5">
                  <p className="text-sm text-white/60">Most loved</p>
                  <p className="mt-2 text-2xl font-semibold">Ethnic Sets</p>
                </div>
                <div className="rounded-3xl bg-amber-200/12 p-5">
                  <p className="text-sm text-white/60">Fresh arrivals</p>
                  <p className="mt-2 text-2xl font-semibold">Statement Layers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
