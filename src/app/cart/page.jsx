"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/helpers/formatPrice";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  const shipping = subtotal > 0 ? 99 : 0;
  const total = subtotal + shipping;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-black/50">Cart</p>
        <h1 className="mt-2 text-4xl font-bold">Your Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 text-black/60">
            Add products and they will appear here.
          </p>
          <Link
            href="/collections"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.cartKey}
                className="grid gap-4 rounded-3xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[120px_1fr_auto]"
              >
                <div className="relative h-[140px] overflow-hidden rounded-2xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-black/60">
                    {item.description}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-black/60">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>

                  <p className="mt-3 font-bold">{formatPrice(item.price)}</p>

                  <div className="mt-4 inline-flex items-center rounded-full border border-black/10">
                    <button
                      onClick={() =>
                        updateQuantity(item.cartKey, item.quantity - 1)
                      }
                      className="px-4 py-2"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-[40px] text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.cartKey, item.quantity + 1)
                      }
                      className="px-4 py-2"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.cartKey)}
                    className="rounded-full p-2 text-black/60 transition hover:bg-black/5 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>

                  <p className="text-lg font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order Summary</h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-black/60">Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>

              <div className="border-t border-black/10 pt-3">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block rounded-2xl bg-black px-4 py-3 text-center font-medium text-white transition hover:opacity-90"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/collections"
              className="mt-3 block rounded-2xl border border-black/10 px-4 py-3 text-center font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}