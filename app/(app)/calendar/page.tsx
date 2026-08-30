'use client';

import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { AccessGate } from '@/app/(auth)/AccessGate';
import { CalendarView } from '@/components/calendar';
import { PageHeader } from '@/components/ui';
import { Roles } from '@/schemas';

/**
 * The organisation's calendar.
 *
 * A flat route at tenant level rather than under a season, because a `Season` belongs to one
 * `League` and the question this screen answers — "is that hall free on Saturday" — spans every
 * competition. See docs/CALENDAR_MODULE.md §1.
 */
export default function CalendarPage() {
  return (
    <AccessGate
      allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN, Roles.TEAM_ADMIN]}
    >
      <PageHeader
        title="Calendrier"
        description="Toutes vos compétitions sur une seule grille."
      />
      <div className="mt-4">
        <CalendarView />
      </div>
      {/* The generator is the next slice; until it is folded into this screen it stays reachable
          from here rather than being orphaned by the nav change. */}
      <p className="mt-6 text-sm text-ink-muted">
        <Link
          href="/tenant/schedule"
          className="inline-flex items-center gap-1.5 text-accent-text hover:underline"
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          Générer des matchs
        </Link>
      </p>
    </AccessGate>
  );
}
