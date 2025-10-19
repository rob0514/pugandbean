export type OrderStatus = "paid" | "refunded" | "failed";

export interface OrderItem {
  productId: string;
  variantId?: string | null;
  title: string;
  unitAmount: number; // cents
  qty: number;
  image?: string;
}

export interface Order {
  id: string; // we’ll use Stripe Checkout Session id
  provider: "stripe";
  status: OrderStatus;
  currency: string; // e.g. "USD"
  amountCents: number; // total in cents
  items: OrderItem[];
  customerEmail?: string | null;
  createdAt: string; // ISO string
}
