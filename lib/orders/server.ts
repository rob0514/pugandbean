import { createOrdersStore } from "@/lib/orders/store";
import type { Order } from "@/types/order";

const store = createOrdersStore();

export async function getOrdersForEmail(email: string): Promise<Order[]> {
  if (!email) return [];
  return store.getByCustomer(email);
}
