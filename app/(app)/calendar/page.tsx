'use client';

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
        action={{ label: 'Générer des matchs', href: '/tenant/schedule', icon: Wand2 }}
      />
      <div className="mt-5">
        <CalendarView />
      </div>
    </AccessGate>
  );
}
