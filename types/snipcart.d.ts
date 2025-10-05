// Minimal, ESLint-clean Snipcart v3 browser types (TEST harness)
// Uses `unknown` instead of `any` and narrows where we actually read data.

declare global {
  /** Subset of store state we actually use (cart item count). */
  interface SnipcartStoreState {
    cart?: { items?: { count?: number } };
  }

  interface SnipcartEventsApi {
    on(name: string, cb: (payload: unknown) => void): void;
    off(name: string, cb: (payload: unknown) => void): void;
  }

  interface SnipcartStoreApi {
    getState(): SnipcartStoreState;
    subscribe(cb: () => void): () => void;
    dispatch(action: unknown): void;
  }

  interface SnipcartApi {
   // ready(cb: () => void): void;
    events: SnipcartEventsApi;
    store: SnipcartStoreApi;
  }

  interface Window {
    Snipcart?: SnipcartApi;
  }
}

export {};
