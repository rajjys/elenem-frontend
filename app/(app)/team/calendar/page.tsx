'use client';

import { CalendarView } from '@/components/calendar';

/**
 * A club's own calendar. The same component the organisation and the competition use, narrowed to
 * this club's fixtures and read-only.
 *
 * A club administrator had no calendar at all — the one thing they open the product for as often
 * as the table. They were not given a fourth screen for it, because the question is the same one
 * the grid already answers.
 */
export default function TeamCalendarPage() {
  return (
    <CalendarView
      club
      title="Calendrier"
      description="Vos rencontres, à domicile et à l’extérieur."
    />
  );
}
