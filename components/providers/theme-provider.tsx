'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'elenem-theme';

interface ThemeContextValue {
  /** The theme actually on screen. There is no third "system" state to render. */
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggle: () => {},
});

/**
 * Runs before first paint, injected into <head> as a blocking script.
 *
 * Without it the server renders light, the client reads localStorage in an effect, and the page
 * visibly flips — the flash of wrong theme that makes a product feel unfinished.
 *
 * The stored value, when present, wins. When absent no attribute is set and the
 * prefers-color-scheme block in globals.css decides — so a first-time visitor lands on whatever
 * their device already prefers, with no flash and nothing to configure.
 */
export const themeInitScript = `
(function(){try{
  var c = localStorage.getItem('${STORAGE_KEY}');
  if (c === 'dark' || c === 'light') document.documentElement.setAttribute('data-theme', c);
  else document.documentElement.removeAttribute('data-theme');
}catch(e){}})();
`.trim();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server and first client render must agree, so start at 'light' and let the effect below
  // reconcile with what the pre-paint script already applied.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'dark' || raw === 'light') stored = raw;
    } catch {
      // Private browsing or blocked storage — fall through to the device preference.
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setThemeState(stored ?? (mq.matches ? 'dark' : 'light'));

    // Keep following the device until the viewer makes an explicit choice.
    const onChange = () => {
      if (!stored) setThemeState(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // Non-fatal: the theme still applies for this page view.
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
