// hooks/useClickAway.ts
import { useEffect, RefObject } from 'react';

type EventType = MouseEvent | TouchEvent;

export function useClickAway<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[], // Can be a single ref or an array of refs
  handler: (event: EventType) => void
): void {
  useEffect(() => {
    const listener = (event: EventType) => {
      const refsArray = Array.isArray(ref) ? ref : [ref];
      let clickedInside = false;

      for (const r of refsArray) {
        const el = r.current;
        // If the click is on the element referenced by a ref, or any of its descendants
        if (el && el.contains(event.target as Node)) {
          clickedInside = true;
          break;
        }
      }

      if (!clickedInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}