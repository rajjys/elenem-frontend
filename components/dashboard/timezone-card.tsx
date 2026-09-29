'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetTenantTimezone } from '@/services/tenants';
import { toastApiError } from '@/utils';
import { TIMEZONES, proposedTimezone, timezoneLabel } from '@/utils/timezones';

/**
 * « À compléter » — the organisation's time zone, until it has been confirmed once
 * (PHASE5B_LEAGUE_SITES §4.4).
 *
 * Every time on the league's public site is the hall's clock, and the DRC has two: a league in Goma
 * is an hour ahead of one in Kinshasa. Sign-up does not ask — it is one more field between an
 * organiser and their first fixture — so the dashboard does, once, with its best guess already
 * chosen: the organiser's own device zone, which knows Goma from Kinshasa where the country cannot.
 * Confirming saves it, and the card is gone for good.
 */
export function TimezoneCard({ tenantId, suggested }: { tenantId: string; suggested: string }) {
  const [zone, setZone] = React.useState(() => proposedTimezone(suggested));
  const [editing, setEditing] = React.useState(false);
  const save = useSetTenantTimezone();

  const confirm = () =>
    save.mutate(
      { tenantId, timezone: zone },
      {
        onSuccess: () => toast.success(`Fuseau horaire enregistré : ${timezoneLabel(zone)}.`),
        onError: (e) => toastApiError(e, 'Le fuseau horaire n’a pas pu être enregistré.'),
      },
    );

  return (
    <section
      aria-labelledby="timezone-card-title"
      className="rounded-md border border-accent-line bg-accent-soft/40 px-4 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">À compléter</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Clock className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
        <div className="min-w-[16rem] flex-1 text-sm">
          <p id="timezone-card-title" className="font-medium text-ink">
            Fuseau horaire : {timezoneLabel(zone, true)}
          </p>
          <p className="text-ink-muted">Les heures de vos matchs sont publiées dans ce fuseau.</p>
        </div>
        {editing ? (
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger aria-label="Fuseau horaire" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((t) => (
                <SelectItem key={t.zone} value={t.zone}>
                  {timezoneLabel(t.zone, true)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
        <Button type="button" variant="primary" size="sm" onClick={confirm} disabled={save.isPending}>
          {save.isPending ? 'Enregistrement…' : 'Confirmer'}
        </Button>
      </div>
    </section>
  );
}
