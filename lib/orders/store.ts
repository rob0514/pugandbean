import type { Order } from "@/types/order";
import { Redis } from "@upstash/redis";

export interface OrdersStore {
  upsert(o: Order): Promise<void>;
  getByCustomer(email: string): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  setRefunded(id: string): Promise<void>;
}

// --------- Redis (Upstash) implementation ---------
function orderKey(id: string) {
  return `order:${id}`;
}
function customerKey(email: string) {
  return `customer:${email.toLowerCase()}:orders`;
}

function hasUpstashEnv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function createRedisStore(): OrdersStore {
  const redis = Redis.fromEnv(); // uses KV_REST_API_URL/TOKEN

  return {
    async upsert(o) {
      await redis.set(orderKey(o.id), o);
      const email = (o.customerEmail ?? "").toLowerCase();
      if (email) {
        await redis.sadd(customerKey(email), o.id); // fine: infers string
      }
    },

    async getByCustomer(email) {
      // NOTE: generic is the WHOLE return type, not the element type
      const ids = (await redis.smembers<string[]>(customerKey(email))) ?? [];
      if (ids.length === 0) return [];

      const orders: Order[] = [];
      for (const id of ids) {
        const o = await redis.get<Order | null>(orderKey(id));
        if (o) orders.push(o);
      }
      return orders;
    },

    async getById(id) {
      const o = await redis.get<Order | null>(orderKey(id));
      return o ?? null;
    },

    async setRefunded(id) {
      const existing = await redis.get<Order | null>(orderKey(id));
      if (!existing) return;
      const updated: Order = { ...existing, status: "refunded" };
      await redis.set(orderKey(id), updated);
    },
  };
}


// --------- Dev in-memory fallback (if no envs locally) ---------
function createInMemoryStore(): OrdersStore {
  const byId = new Map<string, Order>();
  const byEmail = new Map<string, Set<string>>();

  return {
    async upsert(o) {
      byId.set(o.id, o);
      const email = (o.customerEmail ?? "").toLowerCase();
      if (email) {
        if (!byEmail.has(email)) byEmail.set(email, new Set());
        byEmail.get(email)!.add(o.id);
      }
    },
    async getByCustomer(email) {
      const ids = byEmail.get(email.toLowerCase());
      if (!ids) return [];
      return Array.from(ids).map((id) => byId.get(id)!).filter(Boolean);
    },
    async getById(id) {
      return byId.get(id) ?? null;
    },
    async setRefunded(id) {
      const existing = byId.get(id);
      if (existing) byId.set(id, { ...existing, status: "refunded" });
    },
  };
}

// --------- Singleton across HMR / route modules ---------
declare global {
  var __ordersStore: OrdersStore | undefined;
}

export function createOrdersStore(): OrdersStore {
  if (!globalThis.__ordersStore) {
    globalThis.__ordersStore = hasUpstashEnv() ? createRedisStore() : createInMemoryStore();
  }
  return globalThis.__ordersStore;
}
