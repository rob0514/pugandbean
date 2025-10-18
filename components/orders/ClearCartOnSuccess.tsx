"use client";
import { useEffect } from "react";
import { useCart } from "@/store/cart";

export default function ClearCartOnSuccess({
  sessionId,
  paymentStatus
}: { sessionId: string; paymentStatus: string }) {
  const { clear } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (paymentStatus !== "paid") return; // only clear after paid
    const key = `cart-cleared:${sessionId}`;
    if (!localStorage.getItem(key)) {
      clear();
      localStorage.setItem(key, "1");
    }
  }, [sessionId, paymentStatus, clear]);

  return null;
}
