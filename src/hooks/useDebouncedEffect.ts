import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void | (() => void), deps: unknown[], delay = 500) {
  const cleanupRef = useRef<void | (() => void)>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      cleanupRef.current = effect() || undefined;
    }, delay);
    return () => {
      clearTimeout(id);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
