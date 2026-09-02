'use client';

import { CalendarView } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

/**
 * The organisation's calendar: every competition it runs, on one grid.
 *
 * A thin wrapper, like the list pages. `CalendarView` is one component serving tenant, league and
 * later team scope — the pattern `UsersListView` already established — so the two calendars can
 * never drift apart while still living where a reader expects to find them.
 *
 * The header carries no actions. They used to sit here, outside the container that reserves room
 * for the day panel, so opening a fixture hid "Nouveau match" behind the panel. They belong in
 * the calendar's own toolbar, beside the controls they act on.
 */
export default function TenantCalendarPage() {
  return (
    <>
      <PageHeader title="Calendrier" description="Toutes vos compétitions sur une seule grille." />
      <div className="mt-5">
        <CalendarView />
      </div>
    </>
  );
}
