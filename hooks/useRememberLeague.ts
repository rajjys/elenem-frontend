// hooks/useRememberLeague.ts
import { useEffect, useState } from "react";

type Remembered = { id: string; slug: string; name: string; updatedAt: string };

const KEY = "elenem:rememberedTenant";

export function useRememberLeague() {
  const [remembered, setRemembered] = useState<Remembered | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRemembered(JSON.parse(raw));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) { /* ignore */ }
  }, []);

  const remember = (payload: Omit<Remembered, "updatedAt">) => {
    const payloadWithTime = { ...payload, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(payloadWithTime));
    setRemembered(payloadWithTime);
  };

  const forget = () => {
    localStorage.removeItem(KEY);
    setRemembered(null);
  };

  return { remembered, remember, forget };
}
