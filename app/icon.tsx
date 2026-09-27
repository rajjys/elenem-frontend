import { ImageResponse } from 'next/og';

/**
 * The browser-tab icon: the DXScores mark, generated rather than stored, so it cannot drift from
 * the mark the site draws (components/brand). It replaces `app/favicon.ico`, which was the gold
 * Elenem loop. Solid colours only — the accent blue and white — so it reads at 16px.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a3a8d',
          borderRadius: 7,
          color: '#ffffff',
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: -1,
          paddingBottom: 2,
        }}
      >
        dx
      </div>
    ),
    size,
  );
}
