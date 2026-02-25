import { RefObject, useEffect } from "react";

interface useScrollSync {
  ref: RefObject<HTMLElement | null>,
  scrollRatio: number | undefined,
  onScrollChange: ((ratio: number) => void) | undefined
}

export function useScrollSync(
  ref: RefObject<HTMLElement | null>,
  scrollRatio: number | undefined,
  onScrollChange: ((ratio: number) => void) | undefined
): void {
  // restore scroll position on mount
  useEffect(() => {
    const element = ref.current;
    if (!element || !scrollRatio) return;
    requestAnimationFrame(() => {
      element.scrollTop = scrollRatio * (element.scrollHeight - element.clientHeight);
    });
  }, []);

  // track scroll changes
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleScroll = () => {
      const max = element.scrollHeight - element.clientHeight;
      if (max > 0) onScrollChange?.(element.scrollTop / max);
    };
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [onScrollChange]);
}
