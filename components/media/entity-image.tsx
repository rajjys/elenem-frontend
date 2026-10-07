'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { initials, mediaSrc, mediaSrcSet, type ImageKind } from '@/lib/media';

/**
 * A logo or a photo wherever the app shows one — a table row, a card, a header — or the initials
 * when there is none or it fails to load (docs/IMAGES_AND_STORAGE.md §3: a missing image never
 * leaves a hole).
 *
 * A plain <img>, not next/image. The API already stores each image at the sizes we show it at, so
 * there is nothing to optimise; next/image would send every one through Vercel's optimiser and its
 * quota, and it refuses any host not listed in next.config — the development bucket's address was
 * the first to crash a page that way (2026-10-07).
 */
export function EntityImage({
  url,
  name,
  size,
  kind = 'logo',
  shape = 'round',
  className,
  crossOrigin,
}: {
  url: string | null | undefined;
  /** Whose image: for the initials. */
  name: string | null | undefined;
  /** The displayed side, in CSS pixels. */
  size: number;
  /** A logo is fitted whole, a photo fills the shape. */
  kind?: ImageKind;
  shape?: 'round' | 'rounded' | 'square';
  className?: string;
  /** For a page drawn to a canvas (the standings export): the bucket answers with CORS headers. */
  crossOrigin?: 'anonymous';
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const radius = shape === 'round' ? 'rounded-full' : shape === 'rounded' ? 'rounded-lg' : '';

  if (url && !broken) {
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
        crossOrigin={crossOrigin}
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className={cn('shrink-0 bg-surface', radius, kind === 'logo' ? 'object-contain' : 'object-cover', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.36)) }}
      className={cn('flex shrink-0 select-none items-center justify-center bg-surface-sunk font-semibold text-ink-muted', radius, className)}
    >
      {initials(name)}
    </span>
  );
}
