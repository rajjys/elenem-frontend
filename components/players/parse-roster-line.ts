/**
 * One line of a pasted team sheet, as a roster entry.
 *
 * The documented form is the one team lists already use — fields separated by commas:
 *
 *   12, Muhindo Uliza Siméon, Meneur
 *   7, Mumbere Katembo
 *   Eric Kambale
 *
 * Number first, then the full name exactly as the league writes it, then the position. Number and
 * position are optional. A spreadsheet paste works the same way, because its columns arrive
 * separated by tabs.
 *
 * Fields are read by position rather than guessed. The previous parser split on spaces and
 * recognised a position only if it was in a list of known words, so "12 Katembo Janvier Matunda
 * Ailier" worked while "Arrière-ailier" or "Gardien de but" silently became part of the player's
 * name — and with single spaces there was no telling where a name ended. Lines with no separator at
 * all are still read the old way (a leading number, a known position at the end), so a list typed
 * before this change still goes in.
 *
 * The name keeps the order it was typed in: the first word becomes `firstName`, the rest
 * `lastName`, and the two are always shown together, so "Muhindo Uliza Siméon" reads back exactly
 * as entered whether the league writes the family name first or last.
 */
export interface ParsedRosterRow {
  raw: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  problem?: string;
}

/** Only used for lines typed without separators, where a position has to be recognised. */
const POSITION_HINTS = [
  'meneur', 'arrière', 'arriere', 'ailier', 'ailier fort', 'pivot',
  'gardien', 'défenseur', 'defenseur', 'milieu', 'attaquant',
];

const JERSEY = /^#?\s*(\d{1,3})$/;

function splitName(raw: string, name: string, extra: Omit<ParsedRosterRow, 'raw' | 'firstName' | 'lastName'>): ParsedRosterRow {
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { raw, firstName: '', lastName: '', ...extra, problem: extra.problem ?? 'Aucun nom trouvé' };
  }
  if (tokens.length === 1) {
    return { raw, firstName: tokens[0], lastName: '', ...extra, problem: extra.problem ?? 'Nom complet requis (au moins deux mots)' };
  }
  return { raw, firstName: tokens[0], lastName: tokens.slice(1).join(' '), ...extra };
}

export function parseRosterLine(input: string): ParsedRosterRow | null {
  const raw = input.trim();
  if (!raw) return null;

  // ---- Separated fields: commas, semicolons, or a spreadsheet's tabs ----
  if (/[,;\t]/.test(raw)) {
    const fields = raw.split(/[,;\t]/).map((f) => f.trim());
    // Trailing empty cells are common in a spreadsheet paste; they mean nothing.
    while (fields.length && fields[fields.length - 1] === '') fields.pop();

    let jerseyNumber: number | undefined;
    // The number may lead ("12, Nom, Poste") or follow the name ("Nom, 12, Poste").
    const jerseyAt = fields.findIndex((f) => JERSEY.test(f));
    if (jerseyAt !== -1 && jerseyAt <= 1) {
      jerseyNumber = Number(fields[jerseyAt].match(JERSEY)![1]);
      fields.splice(jerseyAt, 1);
    }

    const [name = '', position = '', ...rest] = fields;
    const problem = rest.some(Boolean)
      ? 'Trop de champs — numéro, nom, poste'
      : /\d/.test(name)
        ? 'Le nom contient un chiffre — vérifiez l’ordre des champs'
        : undefined;

    return splitName(raw, name, {
      jerseyNumber,
      position: position || undefined,
      ...(problem ? { problem } : {}),
    });
  }

  // ---- No separators: the older space-only form ----
  const tokens = raw.split(/\s+/);
  let jerseyNumber: number | undefined;
  const lead = tokens[0].match(JERSEY);
  if (lead) {
    jerseyNumber = Number(lead[1]);
    tokens.shift();
  }

  let position: string | undefined;
  const lastTwo = tokens.slice(-2).join(' ').toLowerCase();
  if (tokens.length > 2 && POSITION_HINTS.includes(lastTwo)) {
    position = tokens.splice(-2).join(' ');
  } else if (tokens.length > 1 && POSITION_HINTS.includes(tokens[tokens.length - 1].toLowerCase())) {
    position = tokens.pop();
  }

  return splitName(raw, tokens.join(' '), { jerseyNumber, position });
}

/** A parsed row written back in the documented form — used to leave failed lines in the box. */
export function formatRosterLine(row: Pick<ParsedRosterRow, 'jerseyNumber' | 'firstName' | 'lastName' | 'position'>): string {
  return [row.jerseyNumber ?? '', `${row.firstName} ${row.lastName}`.trim(), row.position ?? '']
    .join(', ')
    .replace(/(, )+$/, '')
    .replace(/^, /, '');
}
