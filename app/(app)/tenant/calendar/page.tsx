'use client';

import { CalendarView } from '@/components/calendar';

/**
 * The organisation's calendar: every competition it runs, on one grid.
 *
 * A thin wrapper, like the list pages. `CalendarView` is one component serving tenant, league and
 * later team scope — the pattern `UsersListView` already established — so the two calendars can
 * never drift apart while still living where a reader expects to find them.
 *
 * It carries its own heading rather than a `PageHeader`, because on this screen the title is part
 * of the toolbar: standing alone it left the whole right-hand side empty while the controls
 * beneath it fought for width.
 */
export default function TenantCalendarPage() {
  return (
    <CalendarView
      title="Calendrier"
      description="Toutes vos compétitions sur une seule grille."
    />
  );
}
