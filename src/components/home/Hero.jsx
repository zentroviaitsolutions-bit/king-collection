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
    <section className="relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white">
      <div className="mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-4 py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm uppercase tracking-[0.3em] text-white/70"
        >
          Premium Fashion Store
        </motion.p>

        <h1
          ref={titleRef}
          className="max-w-3xl text-5xl font-bold leading-tight opacity-0 md:text-7xl"
        >
          Style that feels royal.
        </h1>

        <p
          ref={textRef}
          className="mt-6 max-w-2xl text-base text-white/70 opacity-0 md:text-lg"
        >
          Discover premium ethnic and modern fashion with smooth shopping,
          fast checkout, and a luxury shopping experience.
        </p>

        <div ref={buttonsRef} className="mt-8 flex gap-4 opacity-0">
          <Link
            href="/collections"
            className="rounded-full bg-white px-6 py-3 font-medium text-black transition hover:scale-105"
          >
            Shop Now
          </Link>

          <Link
            href="/track-order"
            className="rounded-full border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
          >
            Track Order
          </Link>
        </div>
      </div>
    </section>
  );
}