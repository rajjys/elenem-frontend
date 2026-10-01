import { PhoneScreen } from '@/components/marketing/phone-screen';

/**
 * The three modules' pictures on the landing (PHASE5A_PRODUCT_SITE §6.5): captures of the demo
 * league, whose clubs and players are fictional (§3.4). Each is about a phone's width, so on a
 * phone it shows at its real size, and on a desktop it needs no more room than half a row.
 *
 * All below the fold, so they load lazily: the first screen costs nothing more. Plain <img> for
 * the reason given in hero-screens.tsx. The day panel and the standings are retaken by
 * scripts/capture-landing.mjs. The WhatsApp previews came from the owner's phone, cut to the
 * message bubbles: the chat around them was a real conversation with a real company.
 */

/** Organisation: one day opened — its games grouped by hall, one hall's games back to back. */
export function DayPanelShot() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see above
    <img
      src="/landing/day-panel-702.webp"
      srcSet="/landing/day-panel-351.webp 351w, /landing/day-panel-702.webp 702w"
      sizes="(min-width: 440px) 351px, calc(100vw - 4.25rem)"
      width={702}
      height={818}
      loading="lazy"
      decoding="async"
      alt="Une journée du calendrier dans DXScores : trois matchs répartis entre deux salles, ceux d’une même salle placés l’un après l’autre."
      className="h-auto w-full max-w-[21.9375rem] rounded-xl border border-line shadow-e2"
    />
  );
}

/** Points: the table as a supporter reads it, with the rule and the tie-breaks under it. */
export function StandingsShot() {
  return (
    <PhoneScreen
      lazy
      src="/landing/standings-phone-780.webp"
      srcSet="/landing/standings-phone-420.webp 420w, /landing/standings-phone-780.webp 780w"
      sizes="(min-width: 640px) 244px, 232px"
      width={780}
      height={1688}
      alt="Le classement sur le site de la ligue, dans un téléphone : le tableau du championnat, puis la règle de points et les critères de départage."
      className="w-60 sm:w-64"
    />
  );
}

/** Publication: what a league's WhatsApp group sees when a link is shared — before opening it. */
export function WhatsAppShots() {
  const bubble = 'h-auto w-full max-w-[17rem] rounded-lg shadow-e1';
  return (
    <div className="flex w-full max-w-[20rem] flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        src="/landing/whatsapp-game-778.webp"
        srcSet="/landing/whatsapp-game-400.webp 400w, /landing/whatsapp-game-778.webp 778w"
        sizes="272px"
        width={778}
        height={765}
        loading="lazy"
        decoding="async"
        alt="Le lien d’un match partagé sur WhatsApp : l’aperçu montre le score final, 81–69."
        className={`${bubble} self-start`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        src="/landing/whatsapp-standings-778.webp"
        srcSet="/landing/whatsapp-standings-400.webp 400w, /landing/whatsapp-standings-778.webp 778w"
        sizes="272px"
        width={778}
        height={805}
        loading="lazy"
        decoding="async"
        alt="Le lien du classement partagé sur WhatsApp : l’aperçu montre le tableau du championnat."
        className={`${bubble} self-end`}
      />
    </div>
  );
}
