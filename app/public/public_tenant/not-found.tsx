import Link from 'next/link';
import { Logo } from '@/components/brand';
import { buildAppUrl } from '@/utils/tenant-url';

/**
 * `<anything>.dxscores.app` that is not a league (PHASE5B_LEAGUE_SITES §5): unknown, or an
 * organisation that is HIDDEN or ARCHIVED, which must look exactly the same. DXScores-branded,
 * because there is no league to brand it — and it turns a dead end into the product's own offer.
 */
export default function NoLeagueHere() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-2xl font-bold text-ink">Aucune ligue à cette adresse</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        Vérifiez l’adresse qu’on vous a partagée — ou créez le site de votre propre ligue, gratuitement.
      </p>
      <Link
        href={buildAppUrl('/register')}
        className="mt-8 rounded-md bg-accent px-5 py-3 font-semibold text-accent-ink shadow-e1 hover:bg-accent-hover"
      >
        Créez la vôtre
      </Link>
      <a href={buildAppUrl('/')} className="mt-4 text-sm text-ink-muted hover:text-ink">
        Découvrir DXScores
      </a>
    </main>
  );
}
