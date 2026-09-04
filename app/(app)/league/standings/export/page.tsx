'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, FileSpreadsheet, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, toastApiError } from '@/utils';
import { useScopeContext } from '@/hooks';
import {
  StandingsDocument,
  type DocumentFields,
} from '@/components/standing/standings-document';
import { useDownloadStandingsXlsx, useStandings } from '@/services/standings';

/**
 * Publishing the table.
 *
 * This is the artefact the whole module exists to replace. LIPROBAKIN's committee computes the
 * standings by hand, sends them to a designer, and the designer rebuilds them in Photoshop for
 * social media — **every matchday**. Removing the hand calculation was the first half; this is the
 * second, and it is the half that makes switching obvious rather than merely helpful.
 *
 * Two outputs, because they are used by different people:
 *
 *  - **PDF**, through the browser's own print. The type stays vector and selectable, the colours
 *    are the ones on screen, and — the reason it is not generated on the server — what the
 *    operator adjusts is literally what comes out. A server-rendered PDF would mean tuning fields
 *    blind and downloading to find out. (It also keeps Chromium out of the deployment, which for
 *    a product shipping to Railway is not a small thing.)
 *  - **Excel**, from the server, for the person who wants to *work* with the numbers rather than
 *    look at them.
 *
 * The fields are remembered per competition, because the same secretary signs the same way every
 * Saturday and retyping their own name fifteen times a season is the kind of friction that sends
 * somebody back to Photoshop.
 */

const STORAGE_PREFIX = 'elenem.standings-export.';

function defaultsFor(
  leagueName: string,
  organisationName: string,
  seasonName: string,
  city: string | null,
): DocumentFields {
  return {
    title: `CLASSEMENT ${leagueName.toUpperCase()}`,
    subtitle: seasonName,
    organisation: organisationName,
    matchday: '',
    city: city ?? '',
    date: new Date().toISOString().slice(0, 10),
    signatoryRole: 'Le Secrétaire Provincial',
    signatoryName: '',
    showBands: true,
    showLogo: true,
  };
}

export default function StandingsExportPage() {
  const ctx = useScopeContext();
  const params = useSearchParams();
  const leagueId = ctx.leagueId;
  const seasonId = params.get('seasonId') ?? undefined;

  const standings = useStandings(leagueId, seasonId);
  const xlsx = useDownloadStandingsXlsx();

  const [fields, setFields] = useState<DocumentFields | null>(null);

  // Seeded from the competition, then from whatever was last published for it. Remembered in the
  // browser rather than on the server: it is one operator's habit, not the league's record, and
  // the values are all one field's worth of retyping if it is lost.
  useEffect(() => {
    if (!standings.data || fields) return;
    const base = defaultsFor(
      standings.data.leagueName,
      standings.data.organisationName,
      standings.data.seasonName,
      standings.data.organisationCity,
    );
    let saved: Partial<DocumentFields> = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + standings.data.leagueId) ?? '{}');
    } catch {
      // A corrupt or unavailable store is not worth a broken screen.
    }
    // The date is always today, never the day it was last published on.
    setFields({ ...base, ...saved, date: base.date });
  }, [standings.data, fields]);

  const documentFields = fields;

  useEffect(() => {
    if (!documentFields || !standings.data) return;
    try {
      localStorage.setItem(
        STORAGE_PREFIX + standings.data.leagueId,
        JSON.stringify(documentFields),
      );
    } catch {
      // Same.
    }
  }, [documentFields, standings.data]);

  const backHref = useMemo(
    () => (leagueId ? `/league/standings?ctxLeagueId=${leagueId}` : '/league/standings'),
    [leagueId],
  );

  if (!leagueId) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-muted">
        Ouvrez une compétition pour publier son classement.
      </p>
    );
  }

  if (standings.isPending || !fields || !standings.data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  const data = standings.data;
  const set = <K extends keyof DocumentFields>(key: K, value: DocumentFields[K]) =>
    setFields((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div data-print-hide>
        <Link
          href={backHref}
          className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Retour au classement
        </Link>

        <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Publier le classement
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Le document signé que vous diffusez après chaque journée. Ce que vous voyez est ce
              qui sort.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                xlsx.mutate(
                  {
                    leagueId,
                    seasonId: data.seasonId,
                    title: fields.title,
                    subtitle: fields.subtitle,
                    matchday: fields.matchday,
                    city: fields.city,
                    date: fields.date,
                    organisation: fields.organisation,
                    signatoryRole: fields.signatoryRole,
                    signatoryName: fields.signatoryName,
                    showBands: fields.showBands,
                  },
                  { onError: (e) => toastApiError(e) },
                )
              }
              isLoading={xlsx.isPending}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" aria-hidden />
              Excel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // The browser's own print, which is also its "save as PDF". Named plainly, because
                // an organiser who wants a file and is offered "Imprimer" will find it, and one who
                // wants paper and is offered "PDF" will not.
                toast.message('Choisissez « Enregistrer au format PDF » dans la boîte d’impression.');
                setTimeout(() => window.print(), 250);
              }}
            >
              <Printer className="mr-1.5 h-4 w-4" aria-hidden />
              PDF / Imprimer
            </Button>
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
        {/* The controls. Deliberately few: everything here is something the published sheet says
            and the database cannot know — which matchday it covers, who signs it, where. */}
        <aside data-print-hide className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="En-tête">
            <Field label="Titre">
              <input
                className={INPUT}
                value={fields.title}
                maxLength={120}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
            <Field label="Sous-titre">
              <input
                className={INPUT}
                value={fields.subtitle}
                maxLength={120}
                placeholder={data.seasonName}
                onChange={(e) => set('subtitle', e.target.value)}
              />
            </Field>
            <Field label="Journée" hint="Laissez vide pour ne pas l’afficher.">
              <input
                className={cn(INPUT, 'w-24 text-center tabular-nums')}
                value={fields.matchday}
                inputMode="numeric"
                maxLength={3}
                onChange={(e) => set('matchday', e.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Toggle
              label="Logo de l’organisation"
              checked={fields.showLogo}
              onChange={(v) => set('showLogo', v)}
            />
          </Panel>

          <Panel title="Signature">
            <Field label="Organisation" hint="Le corps qui publie : « Pour la … »">
              <input
                className={INPUT}
                value={fields.organisation}
                maxLength={120}
                placeholder={data.organisationName}
                onChange={(e) => set('organisation', e.target.value)}
              />
            </Field>
            <Field label="Ville">
              <input
                className={INPUT}
                value={fields.city}
                maxLength={80}
                placeholder={data.organisationCity ?? 'Goma'}
                onChange={(e) => set('city', e.target.value)}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={INPUT}
                value={fields.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </Field>
            <Field label="Fonction">
              <input
                className={INPUT}
                value={fields.signatoryRole}
                maxLength={80}
                onChange={(e) => set('signatoryRole', e.target.value)}
              />
            </Field>
            <Field label="Nom du signataire">
              <input
                className={INPUT}
                value={fields.signatoryName}
                maxLength={80}
                onChange={(e) => set('signatoryName', e.target.value)}
              />
            </Field>
          </Panel>

          <Panel title="Bandes">
            <Toggle
              label="Afficher les places qualificatives et relégables"
              checked={fields.showBands}
              onChange={(v) => set('showBands', v)}
            />
            {!data.rules.bands.qualification && !data.rules.bands.relegation && (
              <p className="text-xs text-ink-subtle">
                Aucune bande n&apos;est définie pour cette compétition.{' '}
                <Link
                  href={`/league/settings/rules?ctxLeagueId=${leagueId}`}
                  className="text-accent-text underline underline-offset-2"
                >
                  Les configurer
                </Link>
              </p>
            )}
          </Panel>
        </aside>

        {/* The preview *is* the document — one renderer, so there is nothing to drift. */}
        <div className="min-w-0 overflow-x-auto pb-4">
          <StandingsDocument
            data={data}
            fields={fields}
            logoUrl={data.organisationLogoUrl}
          />
        </div>
      </div>
    </div>
  );
}

const INPUT =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors ' +
  'hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
      />
      {label}
    </label>
  );
}
