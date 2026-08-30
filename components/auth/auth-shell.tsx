import type { ReactNode } from 'react';
import { SplitShell } from './split-shell';
import { StandingsPreview } from './auth-aside';

/**
 * The signed-out pages, on the shared frame.
 *
 * The panel shows a standings table because the design direction's own test is whether a screen
 * looks like something a federation would publish, and the table is the artefact this product
 * exists to produce. A league president deciding whether this is real should be able to see the
 * answer before signing up.
 */
export function AuthShell(props: {
  title: string;
  subtitle?: ReactNode;
  crossLink?: { prompt: string; label: string; href: string };
  children: ReactNode;
  footer?: ReactNode;
  align?: 'start' | 'center';
}) {
  return <SplitShell {...props} aside={<StandingsPreview />} />;
}
