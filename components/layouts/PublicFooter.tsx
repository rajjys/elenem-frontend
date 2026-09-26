// components/layouts/PublicFooter.tsx
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export const PublicFooter = () => {
    const logoUrl = "/logos/elenem-sport.png";
    const currentYear = new Date().getFullYear();
    return (
        <footer id="footer" className="bg-surface-sunk text-ink border-t border-line ">
        {/* Interim (5A.1): only links that lead somewhere true. The full footer is 5A.2. It listed
            Matchs, Ligues, Actualités (fake posts), Tarifs ($399), API and Docs (placeholders), À
            propos — and claimed "Prêt pour PWA" with no manifest, and to power leagues "en Afrique
            et au-delà" with none yet. */}
        <div className="mx-auto max-w-7xl px-4 py-10 grid sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div>
            <Link href="/" className="flex items-center gap-3">
                <Image src={logoUrl} alt="Elenem Logo" width={120} height={48} className="object-contain" />
            </Link>
            <p className="text-ink-muted mt-3">Le classement se calcule tout seul.</p>
          </div>
          <div>
            <div className="font-medium mb-2">Produit</div>
            <ul className="space-y-1 text-ink-muted ">
              <li><Link href="/#how-it-works" className="hover:underline">Comment ça marche</Link></li>
              <li><Link href="/register" className="hover:underline">Créer ma ligue</Link></li>
              <li><Link href="/login" className="hover:underline">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Informations</div>
            <ul className="space-y-1 text-ink-muted ">
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
              <li><Link href="/legal" className="hover:underline">Mentions légales</Link></li>
              <li><Link href="/terms" className="hover:underline">Conditions d&apos;utilisation</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-6 text-xs text-ink-muted">
          <div>© {currentYear} Elenem. Tous droits réservés.</div>
        </div>
      </footer>
    );
};