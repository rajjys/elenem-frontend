'use client';

import { CalendarView } from '@/components/calendar';

/**
 * One competition's calendar. Same component as the organisation's, narrowed by scope.
 *
 * The other competitions still occupy their halls, so conflicts are still detected across all of
 * them — what changes here is what the reader is shown and can act on, not what the system knows.
 */
export default function LeagueCalendarPage() {
  return <CalendarView title="Calendrier" description="Les matchs de votre compétition." />;
}
