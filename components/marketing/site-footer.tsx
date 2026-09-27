import Link from 'next/link';
import { Logo } from '@/components/brand';

/**
 * The product site's footer (PHASE5A_PRODUCT_SITE §7).
 *
 * Only links that lead somewhere true. The old one listed Matchs, Ligues, Actualités (fake posts),
 * Tarifs ($399), API and Docs (placeholders), and claimed "Prêt pour PWA" with no manifest and to
 * power leagues "en Afrique et au-delà" with none yet.
 *
 * Contact is WhatsApp and a real mailbox (§3.5): the audience lives on WhatsApp, and a form needs a
 * backend, spam handling and someone watching it.
 */
const WHATSAPP_URL =
  'https://wa.me/243975092470?text=' +
  encodeURIComponent('Bonjour, je voudrais utiliser DXScores pour ma ligue.');

const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/#fonctionnalites' },
      { label: 'Comment ça marche', href: '/#comment-ca-marche' },
      { label: 'Créer ma ligue', href: '/register' },
      { label: 'Se connecter', href: '/login' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'WhatsApp · +243 975 092 470', href: WHATSAPP_URL, external: true },
      { label: 'contact@dxscores.com', href: 'mailto:contact@dxscores.com', external: true },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/legal' },
      { label: "Conditions d'utilisation", href: '/terms' },
      { label: 'Confidentialité', href: '/privacy' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label="DXScores — accueil" className="inline-flex">
            <Logo />
          </Link>
          <p className="mt-3 text-sm font-medium text-ink">Le classement se calcule tout seul.</p>
          <p className="mt-1 max-w-xs text-sm text-ink-muted">
            Le calendrier, les résultats et le classement de votre ligue, publiés automatiquement.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="link-grow text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="link-grow text-ink-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-ink-subtle sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} DXScores</span>
          <span>Fait à Goma, RDC</span>
        </div>
      </div>
    </footer>
  );
}
