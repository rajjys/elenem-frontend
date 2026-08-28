'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { Button, Label, LoadingSpinner, ErrorState } from '@/components/ui';
import { toastApiError } from '@/utils';
import { usePreviewFixtures, useCreateFixtures, type GenerateFixturesResponse } from '@/services/fixtures';

const WEEKDAYS = [
  { value: 1, short: 'Lun' }, { value: 2, short: 'Mar' }, { value: 3, short: 'Mer' },
  { value: 4, short: 'Jeu' }, { value: 5, short: 'Ven' }, { value: 6, short: 'Sam' },
  { value: 0, short: 'Dim' },
];

/**
 * Builds a season's whole fixture list in one action.
 *
 * Entering a calendar one game at a time is what stops a league organiser using the product —
 * a 12-team double round robin is 132 separate forms. The flow is deliberately preview-first:
 * generating a schedule is consequential and hard to undo, so nothing is written until the
 * organiser has seen the matchdays laid out.
 */
export function FixtureGenerator({ leagueId }: { leagueId?: string }) {
  const [seasonId, setSeasonId] = useState('');
  const [legs, setLegs] = useState(2);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [kickOffTime, setKickOffTime] = useState('16:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([6, 0]);
  const [preview, setPreview] = useState<GenerateFixturesResponse | null>(null);

  const previewMut = usePreviewFixtures();
  const createMut = useCreateFixtures();

  const { data: seasonsData, isLoading: loadingSeasons, isError } = useQuery({
    queryKey: ['seasons-for-fixtures', leagueId],
    queryFn: async () =>
      (await api.get(`/seasons?pageSize=100${leagueId ? `&leagueId=${leagueId}` : ''}`)).data,
  });
  const seasons: { id: string; name: string; league?: { name: string } }[] =
    seasonsData?.data ?? seasonsData?.items ?? [];

  const chosenSeason = seasons.find((s) => s.id === seasonId);

  const params = useMemo(
    () => ({
      seasonId,
      legs,
      startDate,
      kickOffTime,
      daysOfWeek: daysOfWeek.length ? daysOfWeek : undefined,
      intervalDays: daysOfWeek.length ? undefined : 7,
    }),
    [seasonId, legs, startDate, kickOffTime, daysOfWeek],
  );

  const toggleDay = (d: number) => {
    setPreview(null);
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const runPreview = () => {
    previewMut.mutate(params, {
      onSuccess: (r) => setPreview(r),
      onError: (e) => toastApiError(e),
    });
  };

  const runCreate = () => {
    createMut.mutate(params, {
      onSuccess: (r) => {
        setPreview(r);
        if (r.skippedCount > 0) {
          toast.warning(`${r.createdCount} matchs créés, ${r.skippedCount} ignorés.`);
        } else {
          toast.success(`${r.createdCount} matchs créés sur ${r.matchdayCount} journées.`);
        }
      },
      onError: (e) => toastApiError(e),
    });
  };

  const written = !!preview && !preview.dryRun;
  const busy = previewMut.isPending || createMut.isPending;

  if (isError) return <ErrorState title="Impossible de charger les saisons." />;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
          <Wand2 className="h-6 w-6 text-primary-600" />
          Générer le calendrier
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Crée toutes les journées d&apos;une saison en une fois : chaque équipe rencontre toutes
          les autres, les réceptions sont réparties équitablement. Prévisualisez avant
          d&apos;enregistrer.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div>
            <Label>Saison *</Label>
            {loadingSeasons ? (
              <div className="py-2"><LoadingSpinner /></div>
            ) : (
              <select
                value={seasonId}
                onChange={(e) => { setSeasonId(e.target.value); setPreview(null); }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Choisir une saison…</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.league?.name ? `${s.league.name} — ${s.name}` : s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <Label>Format</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[
                { v: 1, label: 'Aller simple', hint: 'chaque paire se rencontre une fois' },
                { v: 2, label: 'Aller-retour', hint: 'match aller et match retour' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => { setLegs(o.v); setPreview(null); }}
                  className={`rounded-md border p-3 text-left text-sm transition ${
                    legs === o.v
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className="block font-medium">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{o.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Première journée</Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPreview(null); }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <Label>Heure</Label>
              <input
                type="time"
                value={kickOffTime}
                onChange={(e) => { setKickOffTime(e.target.value); setPreview(null); }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <Label>Jours de match</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    daysOfWeek.includes(d.value)
                      ? 'border-primary-500 bg-primary-50 font-medium text-primary-800'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {daysOfWeek.length === 0
                ? 'Aucun jour sélectionné : une journée par semaine.'
                : 'Les journées seront placées sur ces jours.'}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={runPreview}
              disabled={!seasonId || busy}
              isLoading={previewMut.isPending}
            >
              Prévisualiser
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={runCreate}
              disabled={!seasonId || !preview || written || busy}
              isLoading={createMut.isPending}
            >
              Enregistrer
            </Button>
          </div>
          {!preview && seasonId && (
            <p className="text-xs text-gray-500">
              Prévisualisez d&apos;abord — rien n&apos;est enregistré avant votre confirmation.
            </p>
          )}
        </section>

        <section>
          {!preview ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-center">
              <CalendarDays className="mb-3 h-8 w-8 text-gray-300" />
              <p className="font-medium text-gray-900">Aucun aperçu pour l&apos;instant</p>
              <p className="mt-1 max-w-xs text-sm text-gray-500">
                Choisissez une saison et un format, puis prévisualisez le calendrier.
              </p>
            </div>
          ) : (
            <FixturePreview data={preview} seasonName={chosenSeason?.name} />
          )}
        </section>
      </div>
    </div>
  );
}

function FixturePreview({ data, seasonName }: { data: GenerateFixturesResponse; seasonName?: string }) {
  const byMatchday = useMemo(() => {
    const map = new Map<number, typeof data.fixtures>();
    for (const f of data.fixtures) {
      const list = map.get(f.matchday) ?? [];
      list.push(f);
      map.set(f.matchday, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

  const written = !data.dryRun;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div>
          <p className="font-medium text-gray-900">
            {written ? 'Calendrier enregistré' : 'Aperçu du calendrier'}
            {seasonName && <span className="text-gray-500"> · {seasonName}</span>}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {data.teamCount} équipes · {data.fixtureCount} matchs · {data.matchdayCount} journées
          </p>
        </div>
        {written ? (
          data.skippedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {data.createdCount} créés, {data.skippedCount} ignorés
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              {data.createdCount} matchs créés
            </span>
          )
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Rien n&apos;est encore enregistré
          </span>
        )}
      </div>

      {data.skippedCount > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <p className="font-medium">Certains matchs n&apos;ont pas pu être créés :</p>
          <p className="mt-1 text-amber-800">
            {data.fixtures.find((f) => f.error)?.error}
          </p>
        </div>
      )}

      <div className="max-h-[560px] overflow-y-auto px-5 py-4">
        <ol className="space-y-5">
          {byMatchday.map(([matchday, fixtures]) => (
            <li key={matchday}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Journée {matchday}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(fixtures[0].dateTime).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                {fixtures.map((f, i) => (
                  <li
                    key={`${matchday}-${i}`}
                    className={`flex items-center gap-3 px-3 py-2 text-sm ${f.error ? 'bg-red-50' : ''}`}
                  >
                    <span className="flex-1 text-right text-gray-900">{f.homeTeamName}</span>
                    <span className="text-xs text-gray-400">vs</span>
                    <span className="flex-1 text-gray-900">{f.awayTeamName}</span>
                    {f.error && (
                      <span className="text-xs text-red-600" title={f.error}>ignoré</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
