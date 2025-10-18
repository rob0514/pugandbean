"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartLineItem } from "@/lib/schemas/checkout";

export type CartItem = CartLineItem;

type CartState = {
  items: CartItem[];
};

type CartActions = {
  add: (item: CartItem) => void;
  updateQty: (key: { productId: string; variantId: string }, qty: number) => void;
  remove: (key: { productId: string; variantId: string }) => void;
  clear: () => void;
};

function sameKey(a: CartItem, b: { productId: string; variantId: string }) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

// Safe storage for SSR: behaves like localStorage but is no-op on the server
const safeStorage = createJSONStorage<CartState>(() => {
  if (typeof window === "undefined") {
    const memory: Storage = {
      get length() { return 0; },
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
    return memory;
  }
  return window.localStorage;
});

export const useCart = create<CartState & CartActions>()(
  persist(
    (set, _get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const idx = state.items.findIndex((i) => sameKey(i, item));
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + item.qty) };
            return { items: next };
          }
          return { items: [...state.items, item] };
        }),
      updateQty: (key, qty) =>
        set((state) => {
          const clamped = Math.max(1, Math.min(99, qty));
          const next = state.items.map((i) => (sameKey(i, key) ? { ...i, qty: clamped } : i));
          return { items: next };
        }),
      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => !sameKey(i, key)) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "pugandbean-cart",
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
);
