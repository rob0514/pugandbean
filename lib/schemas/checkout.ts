import { z } from "zod";

export const CartLineItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
});

export type CartLineItem = z.infer<typeof CartLineItemSchema>;

export const CheckoutRequestSchema = z.object({
  items: z.array(CartLineItemSchema).min(1),
  // optional URLs if you ever want to override defaults
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
