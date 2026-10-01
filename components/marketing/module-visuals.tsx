import { PhoneScreen } from '@/components/marketing/phone-screen';

/**
 * The three modules' pictures on the landing (PHASE5A_PRODUCT_SITE §6.5): captures of the demo
 * league, whose clubs and players are fictional (§3.4). They stand straight on the section's
 * ground, each in a `.halo` placed by the page — no box around them.
 *
 * All below the fold, so they load lazily: the first screen costs nothing more. Plain <img> for
 * the reason given in hero-screens.tsx. The standings are retaken by scripts/capture-landing.mjs.
 * The « Ajouter un match » dialog and the WhatsApp previews came from the owner's devices; the
 * previews are cut to their message bubbles, leaving out the chat they were sent in.
 */

/** Organisation: placing a game — its hall and hour, a result if it is already played, and the
    day's other games right under it. */
export function AddGameShot() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see above
    <img
      src="/landing/add-game-1020.webp"
      srcSet="/landing/add-game-510.webp 510w, /landing/add-game-1020.webp 1020w"
      sizes="(min-width: 512px) 480px, calc(100vw - 2rem)"
      width={1020}
      height={1386}
      loading="lazy"
      decoding="async"
      alt="Le formulaire « Ajouter un match » : compétition, équipes, heure et salle, le score d’un match déjà joué, et les trois matchs déjà prévus ce jour-là."
      className="h-auto w-full max-w-[30rem] rounded-xl border border-line shadow-e2"
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
  const bubble = 'h-auto w-full max-w-[17rem] rounded-lg shadow-e2';
  return (
    <div className="flex w-full max-w-[19rem] flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        src="/landing/whatsapp-game-776.webp"
        srcSet="/landing/whatsapp-game-400.webp 400w, /landing/whatsapp-game-776.webp 776w"
        sizes="272px"
        width={776}
        height={764}
        loading="lazy"
        decoding="async"
        alt="Le lien d’un match partagé sur WhatsApp : l’aperçu montre le score final, 81–69."
        className={`${bubble} self-start`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        src="/landing/whatsapp-standings-777.webp"
        srcSet="/landing/whatsapp-standings-400.webp 400w, /landing/whatsapp-standings-777.webp 777w"
        sizes="272px"
        width={777}
        height={764}
        loading="lazy"
        decoding="async"
        alt="Le lien du classement partagé sur WhatsApp : l’aperçu montre le haut du tableau du championnat."
        className={`${bubble} self-end`}
      />
    </div>
  );
}
