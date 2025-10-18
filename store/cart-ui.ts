"use client";
import { create } from "zustand";

type CartUIState = { open: boolean };
type CartUIActions = { openCart: () => void; closeCart: () => void; toggleCart: () => void };

export const useCartUI = create<CartUIState & CartUIActions>((set, get) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  toggleCart: () => set({ open: !get().open }),
}));
