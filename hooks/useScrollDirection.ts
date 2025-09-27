// hooks/useScrollDirection.ts
'use client';
import { useState, useEffect } from "react";

/**
 * A hook that returns the user's scroll direction: "up" or "down".
 * - Defaults to "up".
 * - Updates when user scrolls down/up.
 * - Useful for hiding/showing headers, footers, or floating elements.
 */
export function useScrollDirection(threshold = 10) {
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) > threshold) {
        setScrollDir(diff > 0 ? "down" : "up");
        lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
      }
    };

    window.addEventListener("scroll", updateScrollDir);
    return () => window.removeEventListener("scroll", updateScrollDir);
  }, [threshold]);

  return scrollDir;
}
