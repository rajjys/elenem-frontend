'use client';

import { Plus, Wand2 } from 'lucide-react';
import { CalendarView } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

/**
 * The organisation's calendar: every competition it runs, on one grid.
 *
 * A thin wrapper, like the list pages. `CalendarView` is one component serving tenant, league and
 * later team scope — the pattern `UsersListView` already established — so the two calendars can
 * never drift apart while still living where a reader expects to find them.
 */
export default function TenantCalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Toutes vos compétitions sur une seule grille."
        action={{ label: 'Nouveau match', href: '/game/create', icon: Plus }}
        secondaryAction={{ label: 'Générer des matchs', href: '/tenant/calendar/generate', icon: Wand2 }}
      />
      <div className="mt-5">
        <CalendarView />
      </div>
    </>
  );
}
