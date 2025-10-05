export const env = {
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "",
  useSnipcart:
    process.env.NEXT_PUBLIC_USE_SNIPCART === "true" ||
    process.env.USE_SNIPCART === "true",
  // Snipcart PUBLIC key is safe to expose
  snipcartPublicKey:
    process.env.NEXT_PUBLIC_SNIPCART_PUBLIC_API_KEY ??
    process.env.SNIPCART_PUBLIC_API_KEY ??
    "",
} as const;
