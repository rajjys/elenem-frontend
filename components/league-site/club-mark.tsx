import { mediaSrc } from '@/lib/media';
import { cn } from '@/utils/cn';
import type { PublicClubRef } from '@/lib/public-site/api';

/** Two letters for a club with no logo: « Aigles BC » → « AB », « Lionnes » → « LI ». */
function clubInitials(name: string, shortCode: string | null): string {
  const words = name.split(/[\s'’-]+/).filter((w) => w && !/^(de|du|des|la|le|les|d|l|et)$/i.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (shortCode ?? name).slice(0, 2).toUpperCase();
}

const SIZES = {
  xs: 'h-5 w-5 text-[0.55rem]',
  sm: 'h-7 w-7 text-[0.65rem]',
  md: 'h-11 w-11 text-xs',
  lg: 'h-14 w-14 text-base sm:h-16 sm:w-16 sm:text-lg',
} as const;

/** A club's logo, or its initials in a neutral circle — the same weight in every row. */
export function ClubMark({ club, size = 'sm' }: { club: PublicClubRef; size?: keyof typeof SIZES }) {
  if (club.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaSrc(club.logoUrl, 'sm') ?? club.logoUrl} alt="" loading="lazy" className={cn(SIZES[size], 'shrink-0 rounded-full bg-surface object-contain')} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(SIZES[size], 'flex shrink-0 items-center justify-center rounded-full bg-surface-sunk font-bold text-ink-muted ring-1 ring-line')}
    >
      {clubInitials(club.name, club.shortCode)}
    </span>
  );
}
