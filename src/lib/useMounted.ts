import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// Returns false during server rendering and the first client render, then true
// afterward — the standard hydration-safe way to gate client-only UI without
// setting state inside an effect.
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
