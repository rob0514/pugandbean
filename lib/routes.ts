import type { Route } from "next";

export const ROUTES = {
  home: "/" as const,
  blog: "/blog" as const,
  shop: "/shop" as const,
  orders: "/orders" as const,
  account: "/account" as const,
  contact: "/contact" as const,
  about: "/about" as const,
  // add more as pages exist
} satisfies Record<string, Route>;
