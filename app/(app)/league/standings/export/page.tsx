'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ChevronDown,
  FileImage,
  FileSpreadsheet,
  Loader2,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, toastApiError } from '@/utils';
import { useClickAway, useScopeContext } from '@/hooks';
import {
  StandingsDocument,
  type DocumentFields,
} from '@/components/standing/standings-document';
import { useDownloadStandingsXlsx, useStandings, type StandingsView } from '@/services/standings';

/**
 * Publishing the table.
 *
 * The artefact the whole module exists to replace. LIPROBAKIN's committee computes the standings by
 * hand, sends them to a designer, and the designer rebuilds them in Photoshop for social media —
 * every matchday. Removing the hand calculation was the first half; this is the half that makes
 * switching obvious rather than merely helpful.
 *
 * **Three formats, because three different things happen to this sheet.** It is printed and signed
 * (PDF), it is forwarded on WhatsApp (PNG — which is what actually circulates in Goma), and it is
 * sent to somebody who wants to sort the numbers (Excel). One document, one renderer; only the way
 * out differs.
 *
 * The fields come from the federation's own bulletins rather than from what a table needs: a
 * letterhead, a reference number, an object line, the regulation it is issued under, two officers.
 * They are grouped in the order the document reads, so the panel can be understood by scrolling it
 * once beside the preview.
 */

const STORAGE_PREFIX = 'elenem.standings-export.';

function defaultsFor(data: StandingsView): DocumentFields {
  return {
    letterhead: data.organisationName,
    organ: 'COMITÉ EXÉCUTIF',
    reference: '',
    title: `CLASSEMENT ${data.leagueName.toUpperCase()}`,
    // The season, and the phase when the season has more than one.
    //
    // « Saison 2026-2027 · Phase de 6 » — which is the line their own bulletin carries and the
    // secretary retypes every Saturday. Derived from the table being published, so it can never
    // name a phase that is not the one on the page. A single-phase season keeps saying only the
    // season, because « Saison régulière » beside it would be saying nothing twice.
    subtitle: [
      data.seasonName,
      data.stageName !== 'Saison régulière' ? data.stageName : null,
      data.groupName,
    ]
      .filter(Boolean)
      .join(' · '),
    matchday: '',
    preamble: '',
    city: data.organisationCity ?? '',
    date: new Date().toISOString().slice(0, 10),
    organisation: data.organisationName,
    signatoryRole: 'Le Secrétaire Provincial',
    signatoryName: '',
    signatory2Role: '',
    signatory2Name: '',
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
  const [rendering, setRendering] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Seeded from the competition, then from whatever was last published for it. Remembered in the
  // browser rather than on the server: it is one operator's habit, not the league's record, and it
  // is all one sitting's worth of retyping if it is lost.
  useEffect(() => {
    if (!standings.data || fields) return;
    const base = defaultsFor(standings.data);
    let saved: Partial<DocumentFields> = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + standings.data.leagueId) ?? '{}');
    } catch {
      // A corrupt or unavailable store is not worth a broken screen.
    }
    // The date is always today, never the day it was last published on.
    setFields({ ...base, ...saved, date: base.date });
  }, [standings.data, fields]);

  useEffect(() => {
    if (!fields || !standings.data) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + standings.data.leagueId, JSON.stringify(fields));
    } catch {
      // Same.
    }
  }, [fields, standings.data]);

  /**
   * The PNG.
   *
   * A tall single image rather than paginated pages, because the destination is WhatsApp: a photo
   * scrolls and a two-page attachment does not get looked at. Rasterised from the very node on
   * screen, so it cannot disagree with the print.
   */
  const downloadPng = useCallback(async () => {
    const node = previewRef.current?.querySelector<HTMLElement>('[data-print-target]');
    if (!node || !standings.data) return;
    setRendering(true);
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(node, {
        // Twice the CSS size: a bulletin gets zoomed into on a phone, and 1× text goes soft.
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.href = url;
      link.download = `classement-${slugify(standings.data.leagueName)}-${fields?.date ?? ''}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Image enregistrée.');
    } catch (e) {
      toastApiError(e);
    } finally {
      setRendering(false);
    }
  }, [standings.data, fields?.date]);

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
          <DownloadMenu
            busy={rendering || xlsx.isPending}
            onPdf={() => {
              // The browser's own print, which is also its "save as PDF".
              toast.message('Choisissez « Enregistrer au format PDF » dans la boîte d’impression.');
              setTimeout(() => window.print(), 250);
            }}
            onPng={downloadPng}
            onXlsx={() =>
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
                  // The workbook reproduces the letterhead and the signatures too: the two
                  // circulate together, and a spreadsheet opening on a bare grid does not read as
                  // the same act the signed sheet is.
                  letterhead: fields.letterhead,
                  reference: fields.reference,
                  signatoryRole: fields.signatoryRole,
                  signatoryName: fields.signatoryName,
                  signatory2Role: fields.signatory2Role,
                  signatory2Name: fields.signatory2Name,
                  showBands: fields.showBands,
                },
                { onError: (e) => toastApiError(e) },
              )
            }
          />
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* The controls, in the order the document reads them. Everything here is something the
            published sheet says and the database cannot know. */}
        <aside data-print-hide className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="En-tête" hint="Les instances, telles qu’elles sont imprimées sur le papier.">
            <Field label="Institutions" hint="Une par ligne, de la plus générale à la vôtre.">
              <textarea
                className={cn(INPUT, 'h-24 resize-y py-2 leading-snug')}
                value={fields.letterhead}
                maxLength={400}
                onChange={(e) => set('letterhead', e.target.value)}
              />
            </Field>
            <Toggle
              label="Logo de l’organisation"
              checked={fields.showLogo}
              onChange={(v) => set('showLogo', v)}
            />
          </Panel>

          <Panel title="Objet" hint="Ce que la notification annonce, et sous quelle règle.">
            <Field label="Organe">
              <input
                className={INPUT}
                value={fields.organ}
                maxLength={80}
                placeholder="COMITÉ EXÉCUTIF"
                onChange={(e) => set('organ', e.target.value)}
              />
            </Field>
            <Field label="Référence">
              <input
                className={INPUT}
                value={fields.reference}
                maxLength={120}
                placeholder="NOTIFICATION N° 006/EUBAGO/10-1/CE/2026"
                onChange={(e) => set('reference', e.target.value)}
              />
            </Field>
            <Field label="Objet">
              <input
                className={INPUT}
                value={fields.title}
                maxLength={160}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
            <Field label="Préambule" hint="La disposition sous laquelle le classement est arrêté.">
              <textarea
                className={cn(INPUT, 'h-20 resize-y py-2 leading-snug')}
                value={fields.preamble}
                maxLength={400}
                placeholder="Conformément aux dispositions des articles 377, 378 et 379 du RGS, le classement se présente de la manière suivante :"
                onChange={(e) => set('preamble', e.target.value)}
              />
            </Field>
          </Panel>

          <Panel title="Tableau">
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
              label="Places qualificatives et relégables"
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

          <Panel title="Signature">
            <div className="flex gap-3">
              <Field label="Ville" className="min-w-0 flex-1">
                <input
                  className={INPUT}
                  value={fields.city}
                  maxLength={80}
                  placeholder={data.organisationCity ?? 'Goma'}
                  onChange={(e) => set('city', e.target.value)}
                />
              </Field>
              <Field label="Date" className="min-w-0 flex-1">
                <input
                  type="date"
                  className={INPUT}
                  value={fields.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Pour le compte de" hint="Rendu « Pour la … » au-dessus des signatures.">
              <input
                className={INPUT}
                value={fields.organisation}
                maxLength={120}
                placeholder={data.organisationName}
                onChange={(e) => set('organisation', e.target.value)}
              />
            </Field>

            <fieldset className="rounded-lg border border-line p-3">
              <legend className="px-1 text-xs font-medium text-ink-subtle">Signataire</legend>
              <Field label="Fonction">
                <input
                  className={INPUT}
                  value={fields.signatoryRole}
                  maxLength={80}
                  onChange={(e) => set('signatoryRole', e.target.value)}
                />
              </Field>
              <Field label="Nom" className="mt-2">
                <input
                  className={INPUT}
                  value={fields.signatoryName}
                  maxLength={80}
                  onChange={(e) => set('signatoryName', e.target.value)}
                />
              </Field>
            </fieldset>

            <fieldset className="rounded-lg border border-line p-3">
              <legend className="px-1 text-xs font-medium text-ink-subtle">
                Second signataire (facultatif)
              </legend>
              <Field label="Fonction">
                <input
                  className={INPUT}
                  value={fields.signatory2Role}
                  maxLength={80}
                  placeholder="Président"
                  onChange={(e) => set('signatory2Role', e.target.value)}
                />
              </Field>
              <Field label="Nom" className="mt-2">
                <input
                  className={INPUT}
                  value={fields.signatory2Name}
                  maxLength={80}
                  onChange={(e) => set('signatory2Name', e.target.value)}
                />
              </Field>
            </fieldset>
          </Panel>
        </aside>

        {/* The preview *is* the document — one renderer, so there is nothing to drift. */}
        <div ref={previewRef} className="min-w-0 overflow-x-auto pb-4">
          <StandingsDocument data={data} fields={fields} logoUrl={data.organisationLogoUrl} />
        </div>
      </div>
    </div>
  );
}

/**
 * One control, three ways out.
 *
 * Three buttons in a row would have given equal weight to three things that are not equally used —
 * and would have said nothing about their being the same document. A split menu says "publish, in
 * this format", which is the actual decision.
 */
function DownloadMenu({
  busy,
  onPdf,
  onPng,
  onXlsx,
}: {
  busy: boolean;
  onPdf: () => void;
  onPng: () => void;
  onXlsx: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickAway(ref, () => setOpen(false));

  // A menu that only closes on a click elsewhere is a trap for anybody navigating by keyboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const items = [
    { icon: Printer, label: 'PDF', hint: 'À imprimer et signer', run: onPdf },
    { icon: FileImage, label: 'Image PNG', hint: 'À partager sur WhatsApp', run: onPng },
    { icon: FileSpreadsheet, label: 'Excel', hint: 'Pour retravailler les chiffres', run: onXlsx },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        isLoading={busy}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Publier
        <ChevronDown className="ml-1.5 h-4 w-4" aria-hidden />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-line bg-elevated shadow-e2"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunk"
            >
              <it.icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{it.label}</span>
                <span className="block text-xs text-ink-subtle">{it.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const INPUT =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors ' +
  'hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** The control is nested inside the label, which is what associates the two. */
function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
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
