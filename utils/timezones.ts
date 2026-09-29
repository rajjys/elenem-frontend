/**
 * The time zones an organiser picks from (PHASE5B_LEAGUE_SITES §4.4).
 *
 * A list rather than free text: the old « Fuseau Horaire » field took anything, and « UTC+1 » is not
 * a zone a formatter understands. Named by a city the organiser knows, with the offset beside it —
 * and the DRC's two zones say which half of the country they cover, because a league in Goma has
 * no reason to know that its clock is Lubumbashi's.
 */
export const TIMEZONES: { zone: string; city: string; note?: string }[] = [
  { zone: 'Africa/Kinshasa', city: 'Kinshasa', note: 'ouest de la RDC' },
  { zone: 'Africa/Lubumbashi', city: 'Lubumbashi', note: 'est de la RDC : Goma, Bukavu, Kisangani…' },
  { zone: 'Africa/Brazzaville', city: 'Brazzaville' },
  { zone: 'Africa/Kigali', city: 'Kigali' },
  { zone: 'Africa/Bujumbura', city: 'Bujumbura' },
  { zone: 'Africa/Kampala', city: 'Kampala' },
  { zone: 'Africa/Nairobi', city: 'Nairobi' },
  { zone: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam' },
  { zone: 'Africa/Luanda', city: 'Luanda' },
  { zone: 'Africa/Lusaka', city: 'Lusaka' },
  { zone: 'Africa/Johannesburg', city: 'Johannesburg' },
  { zone: 'Africa/Douala', city: 'Douala' },
  { zone: 'Africa/Libreville', city: 'Libreville' },
  { zone: 'Africa/Lagos', city: 'Lagos' },
  { zone: 'Africa/Porto-Novo', city: 'Porto-Novo' },
  { zone: 'Africa/Lome', city: 'Lomé' },
  { zone: 'Africa/Accra', city: 'Accra' },
  { zone: 'Africa/Abidjan', city: 'Abidjan' },
  { zone: 'Africa/Dakar', city: 'Dakar' },
  { zone: 'Europe/Brussels', city: 'Bruxelles' },
  { zone: 'Europe/Paris', city: 'Paris' },
  { zone: 'UTC', city: 'UTC' },
];

/** « UTC+2 » for a zone, today — offsets are read from the runtime, not written down. */
export function utcOffset(zone: string, at = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value;
    return (part ?? 'GMT').replace('GMT', 'UTC').replace(/^UTC$/, 'UTC+0');
  } catch {
    return '';
  }
}

/** « Lubumbashi (UTC+2) », with the note when there is one, for a list or a sentence. */
export function timezoneLabel(zone: string, withNote = false): string {
  const known = TIMEZONES.find((t) => t.zone === zone);
  const city = known?.city ?? zone.split('/').pop()?.replace(/_/g, ' ') ?? zone;
  const base = zone === 'UTC' ? 'UTC' : `${city} (${utcOffset(zone)})`;
  return withNote && known?.note ? `${base} — ${known.note}` : base;
}

/**
 * The zone to propose: the organiser's own device's when it is in the list (someone in Goma gets
 * Lubumbashi, which the country alone cannot tell), otherwise what their country implies.
 */
export function proposedTimezone(suggested: string): string {
  try {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.some((t) => t.zone === device && t.zone !== 'UTC')) return device;
  } catch {
    /* no Intl zone support: fall through */
  }
  return suggested;
}
