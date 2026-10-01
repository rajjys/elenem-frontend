import { cn } from '@/utils/cn';

/**
 * The hero's two screens (PHASE5A_PRODUCT_SITE §6.1): the organiser's calendar in a browser, and
 * a match on the league's site in a supporter's phone. Real captures of the demo league, whose
 * clubs and players are fictional (§3.4).
 *
 * Both sit in the same grid cell, so the cell is as tall as whichever reaches lower and nothing is
 * positioned absolutely; their margins are in percent of the width, so the overlap keeps its shape
 * from a phone to a desktop. The phone covers the calendar's sidebar — the grid and the day panel,
 * the parts worth seeing, stay clear.
 *
 * Plain <img> with srcset: next/image would add a client component for two files already sized
 * and compressed (WebP, 22–70 KB). The browser window carries its own shadow in the file; the
 * phone's frame is drawn here, on tokens, so it follows the theme. Its corners are in percent
 * (width / height, so they stay round): a fixed radius ate the status bar's clock on a small phone.
 */
export function HeroScreens({ className }: { className?: string }) {
  return (
    <div className={cn('grid', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
      <img
        src="/landing/calendar-1000.webp"
        srcSet="/landing/calendar-700.webp 700w, /landing/calendar-1000.webp 1000w, /landing/calendar-1496.webp 1496w"
        sizes="(min-width: 1024px) 850px, 88vw"
        width={1496}
        height={964}
        fetchPriority="high"
        alt="Le calendrier d’une ligue dans DXScores : les matchs de ses deux championnats sur une même grille, et le détail d’un match terminé."
        className="col-start-1 row-start-1 ml-[10%] h-auto w-[90%] md:ml-[13%] md:w-[87%]"
      />
      <div className="z-10 col-start-1 row-start-1 mt-[16%] w-[40%] self-start rounded-[9.3%/4.4%] border border-line-strong bg-elevated p-1 shadow-e2 sm:p-1.5 md:mt-[11%] md:w-[24%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
        <img
          src="/landing/result-phone-527.webp"
          srcSet="/landing/result-phone-360.webp 360w, /landing/result-phone-527.webp 527w"
          sizes="(min-width: 1024px) 235px, (min-width: 768px) 24vw, 40vw"
          width={527}
          height={1134}
          alt="La page d’un match sur le site de la ligue, dans un téléphone : le score final et la comparaison des deux équipes."
          className="h-auto w-full rounded-[7%/3.25%]"
        />
      </div>
    </div>
  );
}
