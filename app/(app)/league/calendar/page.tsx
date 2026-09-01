'use client';

import { Plus, Wand2 } from 'lucide-react';
import { CalendarView } from '@/components/calendar';
import { PageHeader } from '@/components/ui';

/**
 * One competition's calendar. Same component as the organisation's, narrowed by scope.
 *
 * The other competitions still occupy their halls, so conflicts are still detected across all of
 * them — what changes here is what the reader is shown and can act on, not what the system knows.
 */
export default function LeagueCalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Les matchs de votre compétition."
        action={{ label: 'Nouveau match', href: '/game/create', icon: Plus }}
        secondaryAction={{ label: 'Générer des matchs', href: '/league/calendar/generate', icon: Wand2 }}
      />
      <div className="mt-5">
        <CalendarView />
      </div>
    </>
  );
}
