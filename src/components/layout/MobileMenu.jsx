"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isAdmin } from "@/lib/helpers/isAdmin";

export default function MobileMenu({ open, onClose, user, profile }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 z-[70] h-full w-[82%] max-w-sm bg-white p-5 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold">King Collection</h2>
              <button
                onClick={onClose}
                className="rounded-full border border-black/10 p-2"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/"
                onClick={onClose}
                className="block rounded-2xl px-4 py-3 hover:bg-black/5"
              >
                Home
              </Link>
              <Link
                href="/collections"
                onClick={onClose}
                className="block rounded-2xl px-4 py-3 hover:bg-black/5"
              >
                Collections
              </Link>
              <Link
                href="/orders"
                onClick={onClose}
                className="block rounded-2xl px-4 py-3 hover:bg-black/5"
              >
                Orders
              </Link>
              <Link
                href="/track-order"
                onClick={onClose}
                className="block rounded-2xl px-4 py-3 hover:bg-black/5"
              >
                Track Order
              </Link>
              {user && (
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block rounded-2xl px-4 py-3 hover:bg-black/5"
                >
                  Profile
                </Link>
              )}
              {isAdmin(profile) && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="block rounded-2xl px-4 py-3 hover:bg-black/5"
                >
                  Admin
                </Link>
              )}
            </div>

            {!user && (
              <div className="mt-8 grid gap-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="rounded-2xl border border-black/10 px-4 py-3 text-center font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="rounded-2xl bg-black px-4 py-3 text-center font-medium text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}