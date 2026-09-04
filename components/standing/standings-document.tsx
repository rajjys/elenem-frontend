'use client';

import Image from 'next/image';
import { cn } from '@/utils';
import type { StandingsView } from '@/services/standings';

/**
 * The artefact this whole module exists to replace.
 *
 * LIPROBAKIN's committee computes the table by hand, sends it to a designer, and the designer
 * rebuilds it in Photoshop for social media — every matchday. What comes out is a signed document,
 * not a screenshot of a web page, and the difference is the point: it carries the league's mark,
 * the phase and matchday it describes, the qualification and relegation bands with their key, and
 * a footer naming the town, the date and the officer who stands behind it.
 *
 * So this is laid out as a **document**, not as the standings screen with the chrome hidden. It is
 * A4-proportioned, it sits on the `document` surface so it stays on white paper whatever the
 * reader's theme is set to, and its type scale is a printed one.
 *
 * The same component is the preview and the print. There is no second renderer to drift — what
 * they adjust on screen is literally what comes out, which is what makes "customisable" mean
 * anything.
 */

export interface DocumentFields {
  title: string;
  subtitle: string;
  /**
   * Who signs. The bulletin reads "Pour la LIPROBAKIN" — the federation, not the division — and
   * an earlier draft printed "Pour la Championnat Goma D1 Messieurs", which is both wrong about
   * the body and wrong about the article.
   */
  organisation: string;
  /** Matchday. Empty hides the badge — not every published table names one. */
  matchday: string;
  city: string;
  /** `yyyy-mm-dd`. */
  date: string;
  signatoryRole: string;
  signatoryName: string;
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
  // "le 1er septembre", not "le 1 septembre" — it is a formal document and the ordinal is how the
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

  return (
    <article
      data-surface="document"
      data-print-target
      className={cn(
        // A4's ratio at a width that reads at 100% on screen. Fixed rather than fluid, because a
        // document the reader can resize is a document whose printed line breaks are a surprise.
        // A column, so the signature sits at the foot of the page the way it does on paper rather
        // than immediately under the table.
        'mx-auto flex w-[210mm] min-h-[297mm] flex-col bg-surface px-[14mm] py-[12mm] text-ink shadow-e2 print:shadow-none',
        className,
      )}
    >
      <header className="flex items-start gap-5 border-b-2 border-accent pb-4">
        {fields.showLogo && (
          <span className="flex h-[22mm] w-[22mm] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunk">
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
              <span className="px-1 text-center text-[10px] font-semibold leading-tight text-ink-subtle">
                {(fields.organisation || data.organisationName).slice(0, 3).toUpperCase()}
              </span>
            )}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-[19pt] font-bold uppercase leading-tight tracking-tight text-accent-text">
            {fields.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10pt] text-ink-muted">
            {fields.subtitle && <span>{fields.subtitle}</span>}
            {fields.subtitle && fields.matchday && <span className="text-ink-subtle">·</span>}
            {fields.matchday && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[9pt] font-semibold text-accent-ink">
                Journée {fields.matchday}
              </span>
            )}
          </p>
        </div>
      </header>

      <table className="mt-5 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="bg-accent text-accent-ink">
            <th className="w-[8mm] px-1 py-1.5 text-center text-[8.5pt] font-semibold">#</th>
            <th className="px-2 py-1.5 text-left text-[8.5pt] font-semibold uppercase tracking-wide">
              Équipe
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
                  // is read across the wrong line, which is the single most common complaint about
                  // a printed standings sheet.
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
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[9pt]">
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
      <p className="mt-4 border-t border-line pt-2 text-[8pt] text-ink-subtle">
        {data.rules.formula}
        {data.rules.tieBreakers.length > 0 && (
          <> · En cas d&apos;égalité : {data.rules.tieBreakers.join(', puis ').toLowerCase()}</>
        )}
      </p>

      {/* At the foot of the page, because that is where a signature goes and because the gap
          between the table and it is what tells a reader the sheet is finished. */}
      <footer className="mt-auto flex items-end justify-between gap-8 pt-12 text-[10pt]">
        <p className="max-w-[80mm]">
          Fait à {fields.city || '…'}, le {longDate(fields.date)}
          <span className="mt-0.5 block text-ink-muted">
            Pour la {fields.organisation || data.organisationName}
          </span>
        </p>
        <div className="w-[62mm] text-center">
          <p className="font-medium">{fields.signatoryRole}</p>
          {/* Room for the signature and the seal between the title and the name. The published
              sheet has both, and a block with no gap makes the document look unsignable. */}
          <div className="h-[20mm]" aria-hidden />
          <p className="border-t border-line-strong pt-1 font-semibold">
            {fields.signatoryName || '—'}
          </p>
        </div>
      </footer>
    </article>
  );
}
