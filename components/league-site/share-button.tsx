'use client';

import { Share2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * « Partager » — the cheapest high-value thing on a league site (PHASE5B_LEAGUE_SITES §6): a
 * result travels in a WhatsApp group. The phone's own share sheet where there is one, otherwise
 * WhatsApp with the page's title and address. It reads both when pressed, so one button serves
 * every page.
 */
export function ShareButton({ banded }: { banded: boolean }) {
  const share = async () => {
    const title = document.title;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // dismissed: nothing to do
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank', 'noopener');
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
        banded ? 'site-band-hover' : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
      )}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Partager</span>
      <span className="sr-only sm:hidden">Partager</span>
    </button>
  );
}
