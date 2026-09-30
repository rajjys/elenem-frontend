import type { PublicStandings } from '@/lib/public-site/api';
import { formatInstant } from '@/lib/public-site/format';

/**
 * Under the table: what it is made of (PHASE5B_LEAGUE_SITES §6). When it was computed, from how
 * many results, how many are still missing, the rule that turns a result into points, and the
 * order ties are broken in — so a reader can check any row with their own arithmetic. That is the
 * difference between a table a committee signs and one it argues about.
 */
export function TrustLine({ table, zone }: { table: PublicStandings; zone: string }) {
  const facts = [
    table.updatedAt ? `Mis à jour le ${formatInstant(table.updatedAt, zone)}` : null,
    `${table.gamesCounted} match${table.gamesCounted > 1 ? 's' : ''} compté${table.gamesCounted > 1 ? 's' : ''}`,
    table.pendingResults > 0
      ? `${table.pendingResults} résultat${table.pendingResults > 1 ? 's' : ''} en attente`
      : null,
  ].filter(Boolean);
  const bands = [
    table.rules.qualification && { tone: 'bg-positive', ...table.rules.qualification },
    table.rules.relegation && { tone: 'bg-negative', ...table.rules.relegation },
  ].filter((b): b is { tone: string; count: number; label: string } => !!b);

  return (
    <div className="space-y-3 text-sm text-ink-muted">
      {bands.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
          {bands.map((b) => (
            <li key={b.label} className="flex items-center gap-2">
              <span aria-hidden className={`h-3 w-1 rounded-full ${b.tone}`} />
              {b.label} <span className="text-ink-subtle">({b.count})</span>
            </li>
          ))}
        </ul>
      )}
      <p>{facts.join(' · ')}</p>
      <p className="font-medium text-ink">{table.rules.formula}</p>
      {table.rules.tieBreakers.length > 0 && (
        <p>Départage : {table.rules.tieBreakers.map((t, i) => (i === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t.toLowerCase())).join(', puis ')}.</p>
      )}
    </div>
  );
}
