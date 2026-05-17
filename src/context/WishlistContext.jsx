"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUserProducts } from "@/context/UserProductContext";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { getProductPurchaseState } = useUserProducts();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("king-wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to restore wishlist", error);
      localStorage.removeItem("king-wishlist");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("king-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  function isWishlisted(productId) {
    return wishlist.some((item) => item.id === productId);
  }

  function addToWishlist(product) {
    if (!product?.id) {
      return { ok: false, message: "This product could not be saved right now." };
    }

    if (isWishlisted(product.id)) {
      return { ok: false, message: "This product is already in your wishlist." };
    }

    const purchaseState = getProductPurchaseState(product.id);
    if (purchaseState.hasActiveOrder) {
      return {
        ok: false,
        message:
          "This product is already in one of your active orders. You can save it again after delivery.",
      };
    }

    setWishlist((prev) => [...prev, product]);
    return { ok: true, message: "Added to wishlist." };
  }

  function removeFromWishlist(productId) {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    return { ok: true, message: "Removed from wishlist." };
  }

  function toggleWishlist(product) {
    if (isWishlisted(product?.id)) {
      return removeFromWishlist(product.id);
    }

    return addToWishlist(product);
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
