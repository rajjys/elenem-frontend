// hooks/useClickAway.ts
'use client'
import { useEffect, RefObject } from "react";

type EventType = MouseEvent | TouchEvent;

export function useClickAway<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[], // allow null safely
  handler: (event: EventType) => void
): void {
  useEffect(() => {
    const listener = (event: EventType) => {
      const refsArray = Array.isArray(ref) ? ref : [ref];
      let clickedInside = false;

      for (const r of refsArray) {
        const el = r.current;
        if (el && el.contains(event.target as Node)) {
          clickedInside = true;
          break;
        }
      }

      if (!clickedInside) handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
