'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CalendarGenerate } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

/**
 * The draft workspace, under the calendar it belongs to.
 *
 * It lives here rather than at `/tenant/schedule` because generating a fixture list is something
 * you do *to* the calendar, not a separate tool beside it — and because a page belongs under its
 * section while only an identifiable resource earns a flat route.
 */
export default function LeagueCalendarGeneratePage() {
  return (
    <>
      <PageHeader
        title="Générer le calendrier"
        description="Un projet, posé sur le calendrier existant. Rien n'est enregistré avant publication."
      />
      <Link
        href="/league/calendar"
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent-text hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour au calendrier
      </Link>
      <div className="mt-5">
        <CalendarGenerate />
      </div>
    </>
  );
}
