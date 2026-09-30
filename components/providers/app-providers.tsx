import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

/**
 * What the signed-in product needs around every screen: the data cache, the theme switch and the
 * toasts. Mounted by the layouts of the app, the sign-in pages and the admin — not by the root
 * layout, where it used to be, because the landing and every league site then carried ~25 KB of
 * JavaScript for providers none of their pages use, and a league site's budget is 200 KB for
 * everything (PHASE5B_LEAGUE_SITES §4.1). The saved theme still applies everywhere, before first
 * paint, through the root layout's init script.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeProvider>
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
      <Toaster position="top-center" richColors closeButton theme="system" />
    </>
  );
}
