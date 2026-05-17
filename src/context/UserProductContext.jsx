"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

const UserProductContext = createContext();

const VIEW_LIMIT = 12;

function getViewedStorageKey(userId) {
  return `king-viewed-${userId || "guest"}`;
}

function normalizeViewedProduct(product) {
  if (!product?.id) return null;

  return {
    id: product.id,
    slug: product.slug || null,
    title: product.title || "Product",
    image: product.image || null,
    price: Number(product.price || 0),
    category: product.category || "",
    viewedAt: product.viewedAt || new Date().toISOString(),
  };
}

export function UserProductProvider({ children }) {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) {
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, order_status, created_at, order_items(id, product_id, title, image_url, price, quantity, size, color, products(slug))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch user product history", error);
        return;
      }

      setOrders(data || []);
    }

    fetchOrders();
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getViewedStorageKey(user?.id));
      setRecentlyViewed(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error("Failed to restore viewed products", error);
      setRecentlyViewed([]);
      localStorage.removeItem(getViewedStorageKey(user?.id));
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(
        getViewedStorageKey(user?.id),
        JSON.stringify(recentlyViewed)
      );
    } catch (error) {
      console.error("Failed to persist viewed products", error);
    }
  }, [recentlyViewed, user]);

  const purchasedHistory = useMemo(() => {
    return orders
      .filter((order) => order.order_status !== "cancelled")
      .flatMap((order) =>
        (order.order_items || []).map((item) => ({
          id: item.id,
          productId: item.product_id,
          slug: item.products?.slug || null,
          title: item.title,
          image: item.image_url || null,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
          size: item.size || "",
          color: item.color || "",
          orderNumber: order.order_number,
          orderStatus: order.order_status,
          orderedAt: order.created_at,
        }))
      );
  }, [orders]);

  const activeOrderMap = useMemo(() => {
    const map = new Map();

    for (const order of orders) {
      if (order.order_status === "delivered" || order.order_status === "cancelled") {
        continue;
      }

      for (const item of order.order_items || []) {
        if (!item.product_id || map.has(item.product_id)) continue;
        map.set(item.product_id, order.order_status);
      }
    }

    return map;
  }, [orders]);

  const recordRecentlyViewed = useCallback((product) => {
    const normalized = normalizeViewedProduct(product);
    if (!normalized) return;

    setRecentlyViewed((prev) => {
      const next = prev.filter((item) => item.id !== normalized.id);
      return [normalized, ...next].slice(0, VIEW_LIMIT);
    });
  }, []);

  const getProductPurchaseState = useCallback(
    (productId) => {
      if (!productId) {
        return {
          hasActiveOrder: false,
          latestStatus: null,
          hasPurchased: false,
        };
      }

      return {
        hasActiveOrder: activeOrderMap.has(productId),
        latestStatus: activeOrderMap.get(productId) || null,
        hasPurchased: purchasedHistory.some((item) => item.productId === productId),
      };
    },
    [activeOrderMap, purchasedHistory]
  );

  const value = useMemo(
    () => ({
      purchasedHistory,
      recentlyViewed,
      recordRecentlyViewed,
      getProductPurchaseState,
    }),
    [
      purchasedHistory,
      recentlyViewed,
      recordRecentlyViewed,
      getProductPurchaseState,
    ]
  );

  return (
    <UserProductContext.Provider value={value}>
      {children}
    </UserProductContext.Provider>
  );
}

export function useUserProducts() {
  return useContext(UserProductContext);
}
