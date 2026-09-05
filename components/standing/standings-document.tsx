'use client';

import Image from 'next/image';
import { cn } from '@/utils';
import type { StandingsView } from '@/services/standings';

/**
 * The artefact this whole module exists to replace.
 *
 * The first draft of this was a tidy web table on white paper. The real thing — EUBAGO's own
 * notification in `docs/Homologation, classement et calendrier.pdf` — is a **formal act of a
 * committee**, and that difference is most of the design:
 *
 *  - a **letterhead** naming the chain of bodies it is issued under, from the Republic down to the
 *    urban entente;
 *  - the **organ** that issued it and a **reference number**, because it is filed and cited;
 *  - an **object** line and a **preamble** citing the articles of the regulation the ranking is
 *    computed under;
 *  - a **heading over the table** — their sheets carry two, "A. VERSION MASCULINE" and
 *    "B. VERSION FÉMININE", so it is a field rather than the season's name;
 *  - and **two signatures** side by side, with room for the stamps that make it real.
 *
 * None of that is decoration. It is what makes the sheet an official document rather than a
 * screenshot, and reproducing it is the whole reason a league would stop sending its numbers to a
 * designer. Every part is a field the organisation fills in once and forgets.
 *
 * The same component is the preview, the print and the PNG — one renderer, so what is adjusted on
 * screen is literally what comes out. That is what makes "customisable" mean anything here.
 */

export interface DocumentFields {
  /** The chain of bodies, one per line, most senior first. */
  letterhead: string;
  /** The organ issuing it: "COMITÉ EXÉCUTIF". Empty hides the line. */
  organ: string;
  /** "NOTIFICATION N° 006/EUBAGO/10-1/CE/2026". Empty hides it. */
  reference: string;
  /** The object of the notification, rendered after "OBJET :". */
  title: string;
  /** What sits over the table: the season, or "A. VERSION MASCULINE". */
  subtitle: string;
  /** Matchday. Empty hides the badge — not every published table names one. */
  matchday: string;
  /** The regulatory sentence above the table. Empty hides it. */
  preamble: string;
  city: string;
  /** `yyyy-mm-dd`. */
  date: string;
  /** Who publishes, rendered "Pour la …" above the signatures. */
  organisation: string;
  signatoryRole: string;
  signatoryName: string;
  /** A second officer. Both empty hides the column — one signature is a valid document too. */
  signatory2Role: string;
  signatory2Name: string;
  showBands: boolean;
  showLogo: boolean;
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  // "le 1er septembre", not "le 1 septembre" — it is a formal document, and the ordinal is how the
  // date is written on one in French.
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`;
}

export function StandingsDocument({
  data,
  fields,
  logoUrl,
  className,
}: {
  data: StandingsView;
  fields: DocumentFields;
  logoUrl?: string | null;
  className?: string;
}) {
  const bands = data.rules.bands;
  const showBands = fields.showBands && (bands.qualification || bands.relegation);
  const institutions = fields.letterhead
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const hasSecond = !!(fields.signatory2Role.trim() || fields.signatory2Name.trim());

  return (
    <article
      data-surface="document"
      data-print-target
      className={cn(
        // A4's width at a scale that reads at 100% on screen. Fixed rather than fluid, because a
        // document the reader can resize is one whose printed line breaks are a surprise.
        //
        // The *height* is the content's. An earlier version forced a full page and pushed the
        // signature to the bottom of it, so a ten-row table printed with a hand's width of nothing
        // in the middle and the footer read as page furniture rather than as the end of the text.
        'mx-auto w-[210mm] bg-surface px-[14mm] py-[12mm] text-ink shadow-e2 print:shadow-none',
        className,
      )}
    >
      {/* The letterhead. Centred and stacked, with the crest beside it rather than above the
          title — the shape every ministry-style header in the region uses. */}
      <header className="border-b-2 border-accent pb-2">
        <div className="flex items-start gap-4">
          {fields.showLogo && (
            <span className="flex h-[20mm] w-[20mm] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt=""
                  width={120}
                  height={120}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="px-1 text-center text-[8pt] font-semibold leading-tight text-ink-subtle">
                  {(institutions[institutions.length - 1] ?? data.organisationName)
                    .slice(0, 3)
                    .toUpperCase()}
                </span>
              )}
            </span>
          )}

          <div className="min-w-0 flex-1 text-center">
            {institutions.map((line, i) => (
              <p
                key={i}
                className={cn(
                  'uppercase leading-tight',
                  // Read top-down and narrowing as it goes: the state, the federation, the
                  // provincial league, then the body that actually issues the sheet — which is the
                  // one that gets the weight.
                  i === 0 ? 'text-[12pt] font-bold tracking-tight' : 'text-[10.5pt]',
                  i > 0 && i < institutions.length - 1 && 'text-ink-muted',
                  i > 0 && i === institutions.length - 1 && 'font-semibold text-accent-text',
                )}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Balances the crest, so the letterhead is centred on the page and not on the space
              left over beside it. */}
          {fields.showLogo && <span className="h-[20mm] w-[20mm] shrink-0" aria-hidden />}
        </div>

      </header>

      <div className="mt-3 space-y-1.5">
        {fields.organ && <p className="text-[10pt] font-bold uppercase">{fields.organ}</p>}
        {fields.reference && (
          <p className="text-center text-[11pt] font-bold uppercase tracking-tight">
            {fields.reference}
          </p>
        )}
        {fields.title && (
          <p className="text-[10.5pt] font-bold uppercase">Objet&nbsp;: {fields.title}</p>
        )}
        {fields.preamble && <p className="text-[10pt] leading-snug">{fields.preamble}</p>}
      </div>

      {(fields.subtitle || fields.matchday) && (
        <p className="mt-3 flex items-center gap-2 text-[10.5pt] font-bold uppercase">
          {fields.subtitle}
          {fields.matchday && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[8.5pt] font-semibold normal-case text-accent-ink">
              Journée {fields.matchday}
            </span>
          )}
        </p>
      )}

      <table className="mt-1.5 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="bg-accent text-accent-ink">
            <th className="w-[8mm] px-1 py-1.5 text-center text-[8.5pt] font-semibold">N°</th>
            <th className="px-2 py-1.5 text-left text-[8.5pt] font-semibold uppercase tracking-wide">
              Équipes
            </th>
            {data.columns.map((c) => (
              <th
                key={c.key}
                className="w-[11mm] px-1 py-1.5 text-center text-[8.5pt] font-semibold uppercase"
              >
                {c.abbr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => {
            const band = showBands ? row.band : null;
            return (
              <tr
                key={row.teamId}
                className={cn(
                  'border-b border-line',
                  // A very light tint on alternate rows: on paper a fifteen-row table without one
                  // gets read across the wrong line, which is the commonest complaint about a
                  // printed standings sheet.
                  i % 2 === 1 && !band && 'bg-surface-sunk/60',
                  band === 'QUALIFICATION' && 'bg-positive-soft',
                  band === 'RELEGATION' && 'bg-negative-soft',
                )}
              >
                <td
                  className={cn(
                    'px-1 py-[3px] text-center font-semibold tabular-nums',
                    band === 'QUALIFICATION' && 'text-positive',
                    band === 'RELEGATION' && 'text-negative',
                  )}
                >
                  {row.rank}
                </td>
                <td className="px-2 py-[3px] font-medium">{row.teamName}</td>
                {data.columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-1 py-[3px] text-center tabular-nums',
                      c.key === 'points' ? 'font-bold' : 'text-ink-muted',
                    )}
                  >
                    {c.key === 'goalDifference' && row[c.key] > 0 ? `+${row[c.key]}` : row[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* The key. A coloured band with nothing explaining it is decoration; with this it is the
          competition's promise in writing, which is why the published sheet carries one. */}
      {showBands && (
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[9pt]">
          {bands.qualification && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-sm bg-positive-soft ring-1 ring-positive/50" aria-hidden />
              {bands.qualification.label}
            </span>
          )}
          {bands.relegation && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-sm bg-negative-soft ring-1 ring-negative/50" aria-hidden />
              {bands.relegation.label}
            </span>
          )}
        </div>
      )}

      {/* How the points were arrived at. On paper this matters more than on screen: the sheet
          circulates without us, and it is the line that stops a club arguing with it. */}
      <p className="mt-2 text-[8pt] text-ink-subtle">
        {data.rules.formula}
        {data.rules.tieBreakers.length > 0 && (
          <> · En cas d&apos;égalité : {data.rules.tieBreakers.join(', puis ').toLowerCase()}</>
        )}
      </p>

      {/* Follows the table rather than sinking to the bottom of the page: this is the end of the
          text, not a page footer, and a fixed gap keeps it that way for a table of any length. */}
      <footer className="mt-8 text-[10pt]">
        <p className="text-right">
          Fait à {fields.city || '…'}, le {longDate(fields.date)}
        </p>
        <p className="mt-3 text-center font-semibold uppercase">
          Pour la {fields.organisation || data.organisationName}
        </p>
        <div className={cn('mt-2 flex gap-8', hasSecond ? 'justify-between' : 'justify-end')}>
          <Signature role={fields.signatoryRole} name={fields.signatoryName} />
          {hasSecond && <Signature role={fields.signatory2Role} name={fields.signatory2Name} />}
        </div>
      </footer>
    </article>
  );
}

/** One officer: their title, room for the signature and the stamp, then the name. */
function Signature({ role, name }: { role: string; name: string }) {
  return (
    <div className="w-[62mm] text-center">
      <p className="font-medium">{role}</p>
      {/* The gap is the point. A block with no room for a signature and a seal makes the document
          look unsignable, which is exactly what it is not. */}
      <div className="h-[18mm]" aria-hidden />
      <p className="border-t border-line-strong pt-1 font-semibold uppercase">{name || '—'}</p>
    </div>
  );
}
