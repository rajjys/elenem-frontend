/**
 * Dates and times on a league site (PHASE5B_LEAGUE_SITES §4.4).
 *
 * The API already gives every game its date and time on the league's own clock (`localDate`,
 * `localTime`), so most of what is here only puts them into French. A local date is formatted as
 * the calendar day it names — at noon UTC, read in UTC — so no reader's own zone can shift it.
 */

const asDay = (localDate: string) => new Date(`${localDate}T12:00:00Z`);

/** « sam. 26 sept. », or « samedi 26 septembre » in full. */
export function formatDate(localDate: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    weekday: style,
    day: 'numeric',
    month: style,
  }).format(asDay(localDate));
}

/** « 16 h 00 », the way a French-speaking league writes a kickoff. */
export function formatTime(localTime: string): string {
  const [h, m] = localTime.split(':');
  return `${Number(h)} h ${m}`;
}

/** Today's date on the league's clock. */
export function todayIn(zone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** « Aujourd'hui », « Demain », « Hier », or the date itself. */
export function dayLabel(localDate: string, today: string): string {
  const diff = Math.round((asDay(localDate).getTime() - asDay(today).getTime()) / 86_400_000);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return formatDate(localDate);
}

/** An instant on the league's clock: « 26 sept. à 18 h 40 », for « Mis à jour le … ». */
export function formatInstant(instant: string, zone: string): string {
  const at = new Date(instant);
  const date = new Intl.DateTimeFormat('fr-FR', { timeZone: zone, day: 'numeric', month: 'short' }).format(at);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  return `${date} à ${formatTime(time)}`;
}

/** yyyy-mm-dd moved by whole days. */
export function addDays(localDate: string, days: number): string {
  return new Date(asDay(localDate).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** The Monday of a local date's week: a league's week runs Monday to Sunday. */
export function mondayOf(localDate: string): string {
  const weekday = asDay(localDate).getUTCDay();
  return addDays(localDate, -((weekday + 6) % 7));
}

/** « 28 sept. », without the weekday, for ranges. */
export function formatShortDate(localDate: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(asDay(localDate));
}
