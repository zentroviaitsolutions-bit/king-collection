"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUserProducts } from "@/context/UserProductContext";

const CartContext = createContext();
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

function normalizeCartItem(item) {
  if (!item) return item;

  return {
    ...item,
    image: item.image?.trim?.() ? item.image : FALLBACK_IMAGE,
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { getProductPurchaseState } = useUserProducts();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("king-cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart(Array.isArray(parsed) ? parsed.map(normalizeCartItem) : []);
      }
    } catch (error) {
      console.error("Failed to restore cart", error);
      localStorage.removeItem("king-cart");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("king-cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    if (!product?.id) {
      return { ok: false, message: "This product could not be added right now." };
    }

    const purchaseState = getProductPurchaseState(product.id);
    if (purchaseState.hasActiveOrder) {
      return {
        ok: false,
        message:
          "This product is already in one of your active orders. You can add it again after delivery.",
      };
    }

    const cartKey = `${product.id}-${product.variant_id || "default"}`;
    const maxStock = Number(product.stock ?? Infinity);
    const found = cart.find((item) => item.cartKey === cartKey);

    if (found && found.quantity >= maxStock) {
      return {
        ok: false,
        message: "You already have the maximum available quantity in your cart.",
      };
    }

    if (!found && maxStock <= 0) {
      return { ok: false, message: "This item is currently out of stock." };
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (found) {
        if (existing?.quantity >= maxStock) {
          return prev;
        }

        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (maxStock <= 0) {
        return prev;
      }

      return [
        ...prev,
        {
          ...normalizeCartItem(product),
          cartKey,
          quantity: 1,
        },
      ];
    });

    return {
      ok: true,
      message: found ? "Cart quantity updated." : "Added to cart.",
    };
  }

  function removeFromCart(cartKey) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }

  function updateQuantity(cartKey, quantity) {
    if (quantity <= 0) return removeFromCart(cartKey);

    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? {
              ...item,
              quantity: Math.min(quantity, Number(item.stock ?? quantity)),
            }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
