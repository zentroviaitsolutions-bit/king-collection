"use client";

import Link from "next/link";
import { ShoppingCart, Heart, User, Menu } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/helpers/isAdmin";
import MobileMenu from "@/components/layout/MobileMenu";

export default function Navbar() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-full border border-black/10 bg-white/80 p-2 shadow-sm md:hidden"
            >
              <Menu size={18} />
            </button>

            <Link href="/" className="flex flex-col leading-none">
              <span className="font-serif text-2xl font-bold tracking-[0.08em]">
                KING
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.42em] text-black/45">
                Collection
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 shadow-sm md:flex">
            <Link href="/" className="rounded-full px-3 py-2 text-sm hover:bg-black/5">
              Home
            </Link>
            <Link
              href="/collections"
              className="rounded-full px-3 py-2 text-sm hover:bg-black/5"
            >
              Collections
            </Link>
            <Link
              href="/orders"
              className="rounded-full px-3 py-2 text-sm hover:bg-black/5"
            >
              Orders
            </Link>
            <Link
              href="/track-order"
              className="rounded-full px-3 py-2 text-sm hover:bg-black/5"
            >
              Track Order
            </Link>
            {isAdmin(profile) && (
              <Link href="/admin" className="rounded-full px-3 py-2 text-sm hover:bg-black/5">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/wishlist"
              className="relative rounded-full border border-transparent p-2 hover:border-black/10 hover:bg-white/70"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full border border-transparent p-2 hover:border-black/10 hover:bg-white/70"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link
              href={user ? "/profile" : "/login"}
              className="flex items-center gap-2 rounded-full border border-transparent p-2 hover:border-black/10 hover:bg-white/70"
            >
              <User size={20} />
            </Link>

            {!user && (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/login"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-black px-4 py-2 text-sm text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        profile={profile}
      />
    </>
  );
}
