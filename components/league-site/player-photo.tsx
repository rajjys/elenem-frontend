import { cn } from '@/utils/cn';
import { mediaSrc, mediaSrcSet } from '@/lib/media';

/**
 * A player's photo on a league site, round as it was framed when uploaded. Server-rendered, so the
 * caller decides what shows when there is none; the API sends a photo only for a named player.
 */
export function PlayerPhoto({ url, size, className }: { url: string; size: number; className?: string }) {
  const srcSet = mediaSrcSet(url);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaSrc(url, size <= 64 ? 'sm' : 'md') ?? url}
      srcSet={srcSet ?? undefined}
      sizes={srcSet ? `${size}px` : undefined}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-full bg-surface-sunk object-cover', className)}
    />
  );
}
