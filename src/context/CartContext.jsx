"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("king-cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("king-cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    const cartKey = `${product.id}-${product.variant_id || "default"}`;

    // ✅ NEW: max stock logic
    const maxStock = Number(product.stock ?? Infinity);

    setCart((prev) => {
      const found = prev.find((item) => item.cartKey === cartKey);

      // ✅ UPDATED: prevent exceeding stock
      if (found) {
        if (found.quantity >= maxStock) {
          return prev;
        }

        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // ✅ NEW: prevent adding if out of stock
      if (maxStock <= 0) {
        return prev;
      }

      return [
        ...prev,
        {
          ...product,
          cartKey,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(cartKey) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }

  function updateQuantity(cartKey, quantity) {
    if (quantity <= 0) return removeFromCart(cartKey);

    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity } : item
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