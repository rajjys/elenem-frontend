'use client';

import { FlaskConical } from 'lucide-react';
import { CalendarGenerate } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

/**
 * The draft workspace, under the calendar it belongs to.
 *
 * It lives here rather than at `/tenant/schedule` because generating a fixture list is something
 * you do *to* the calendar, not a separate tool beside it — and because a page belongs under its
 * section while only an identifiable resource earns a flat route.
 *
 * Framed as experimental on purpose. Deciding a fixture list is a political act inside a
 * federation: a committee agrees it, and handing that to software is not a feature request, it is
 * a change of who decides. Most leagues will record a calendar decided elsewhere for a long time
 * before they let one be generated, so this page says what it is rather than presenting itself as
 * the way in.
 */
export default function TenantCalendarGeneratePage() {
  return (
    <>
      <PageHeader
        title="Générer le calendrier"
        description="Un projet, posé sur le calendrier existant. Rien n'est enregistré avant publication."
      />
      <p className="-mt-3 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-line bg-surface-sunk px-3.5 py-2.5 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <FlaskConical className="h-4 w-4 text-caution" aria-hidden />
          Fonctionnalité expérimentale
        </span>
        <span>
          Elle s&apos;améliorera au fil des saisons. La plupart des ligues décident leur calendrier
          ailleurs et le saisissent — c&apos;est le chemin normal, et il reste le plus rapide.
        </span>
      </p>
      <CalendarGenerate />
    </>
  );
}
