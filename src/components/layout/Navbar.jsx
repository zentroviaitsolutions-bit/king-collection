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
              className="rounded-full border border-black/10 p-2 md:hidden"
            >
              <Menu size={18} />
            </button>

            <Link href="/" className="text-2xl font-bold tracking-wide">
              King Collection
            </Link>
          </div>

          <nav className="hidden gap-6 md:flex">
            <Link href="/">Home</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/orders">Orders</Link>
            <Link href="/track-order">Track Order</Link>
            {isAdmin(profile) && <Link href="/admin">Admin</Link>}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="relative">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link href={user ? "/profile" : "/login"} className="flex items-center gap-2">
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