import { mediaSrc } from '@/lib/media';
import { cn } from '@/utils/cn';
import { initialsOf } from '@/lib/public-site/nav';

/**
 * A league's mark: its logo when it has one, otherwise its initials on a neutral square
 * (PHASE5B_LEAGUE_SITES §4.6) — never a skeleton, never a coloured blob that means nothing.
 */
export function SiteMark({
  name,
  logoUrl,
  size = 'sm',
}: {
  name: string;
  logoUrl: string | null;
  size?: 'sm' | 'lg';
}) {
  const box = size === 'lg' ? 'h-16 w-16 rounded-2xl text-xl' : 'h-9 w-9 rounded-lg text-xs';
  if (logoUrl) {
    return (
      // A league's logo can live on any host, which next/image would refuse; it is small and
      // above the fold, so a plain image with its size set costs nothing.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaSrc(logoUrl, 'sm') ?? logoUrl} alt="" width={size === 'lg' ? 64 : 36} height={size === 'lg' ? 64 : 36} className={cn(box, 'shrink-0 bg-surface object-contain')} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(box, 'flex shrink-0 items-center justify-center bg-surface-sunk font-bold tracking-tight text-ink ring-1 ring-line')}
    >
      {initialsOf(name)}
    </span>
  );
}
