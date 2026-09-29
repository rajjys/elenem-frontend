import { useCallback, useEffect, useState } from 'react';

/** How long a "send me a code again" button stays shut after a code goes out. */
export const RESEND_SECONDS = 30;

/**
 * A countdown for buttons that send an e-mail. Without it, a reader who does not see the code
 * arrive at once presses again, and again — each press a new e-mail, a new code that invalidates
 * the last, and a step closer to the API's rate limit. The button shows the seconds left instead.
 *
 * `start()` when a code has just been sent; `remaining` is 0 when the button may be used.
 */
export function useCooldown(seconds = RESEND_SECONDS, startRunning = false) {
  const [remaining, setRemaining] = useState(startRunning ? seconds : 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  return { remaining, start };
}
