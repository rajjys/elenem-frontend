'use client';

import { use } from 'react';
import { SeasonFormatView } from '@/components/season/season-format-view';

/**
 * A season's shape, under the season it belongs to.
 *
 * The first season-scoped page in the product. It renders the reader's own chrome — the league
 * layout's sidebar, not a one-item menu naming itself — which is what `/season/[id]` got wrong
 * before it was retired (`GAME_AND_STANDINGS` §2.3).
 */
export default function SeasonFormatPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = use(params);
  return <SeasonFormatView seasonId={seasonId} />;
}
