'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'elenem-theme';

interface ThemeContextValue {
  /** What the viewer chose. 'system' means "follow the OS". */
  choice: ThemeChoice;
  /** What is actually on screen right now. */
  resolved: 'light' | 'dark';
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  choice: 'system',
  resolved: 'light',
  setChoice: () => {},
});

/**
 * Runs before first paint, injected into <head> as a blocking script.
 *
 * Without this the server renders light, the client reads localStorage in an effect, and the page
 * visibly flips — the flash of wrong theme that makes a product feel unfinished. The old
 * `useI18n` hook has exactly this bug for language; we are not repeating it for colour.
 *
 * Reads as: an explicit choice wins; otherwise leave the attribute off and let the
 * prefers-color-scheme media query in globals.css decide.
 */
export const themeInitScript = `
(function(){try{
  var c = localStorage.getItem('${STORAGE_KEY}');
  if (c === 'dark' || c === 'light') document.documentElement.setAttribute('data-theme', c);
  else document.documentElement.removeAttribute('data-theme');
}catch(e){}})();
`.trim();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start at 'system' on both server and client so hydration matches; the pre-paint script has
  // already applied the real attribute, and the effect below syncs React's copy of it.
  const [choice, setChoiceState] = useState<ThemeChoice>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  const apply = useCallback((c: ThemeChoice) => {
    const root = document.documentElement;
    if (c === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', c);

    const isDark =
      c === 'dark' ||
      (c === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setResolved(isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    let stored: ThemeChoice = 'system';
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'dark' || raw === 'light') stored = raw;
    } catch {
      // Private browsing, blocked storage — 'system' is a fine answer.
    }
    setChoiceState(stored);
    apply(stored);

    // Follow the OS live, but only while the viewer hasn't overridden it.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (stored === 'system') setResolved(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [apply]);

  const setChoice = useCallback(
    (c: ThemeChoice) => {
      setChoiceState(c);
      apply(c);
      try {
        if (c === 'system') localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, c);
      } catch {
        // Non-fatal: the theme still applies for this page view.
      }
    },
    [apply],
  );

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
