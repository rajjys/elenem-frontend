'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

/**
 * A YouTube video that costs nothing until it is played (PHASE5A_PRODUCT_SITE §6.3b).
 *
 * A plain YouTube iframe loads over a megabyte of JavaScript on page load, before anyone presses
 * play — more than the whole page's budget, paid on mobile data by every visitor. This shows the
 * video's thumbnail and a play button; the privacy-enhanced iframe replaces it only when tapped.
 */
export function VideoFacade({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-xl border border-line"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Lire la vidéo : ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface-sunk"
    >
      <Image
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1024px) 896px, 100vw"
        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
        unoptimized
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-e2 motion-safe:transition-transform motion-safe:group-hover:scale-105">
          <Play className="ml-1 h-7 w-7" fill="currentColor" />
        </span>
      </span>
    </button>
  );
}
