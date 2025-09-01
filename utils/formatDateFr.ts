import { format, isToday, isYesterday, isTomorrow, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDateFr(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  if (isToday(date)) {
    return `Aujourd'hui à ${format(date, 'HH:mm')}`;
  }

  if (isYesterday(date)) {
    return `Hier à ${format(date, 'HH:mm')}`;
  }

  if (isTomorrow(date)) {
    return `Demain à ${format(date, 'HH:mm')}`;
  }

  const diff = differenceInCalendarDays(date, now);

  // Optional: handle "Après-demain" or "Avant-hier"
  if (diff === 2) {
    return `Après-demain à ${format(date, 'HH:mm')}`;
  }
  if (diff === -2) {
    return `Avant-hier à ${format(date, 'HH:mm')}`;
  }

  // Fallback to short date format
  return `${format(date, 'd MMM', { locale: fr })}, ${format(date, 'HH:mm')}`;
}
