// components/layouts/PublicFooter.tsx
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export const PublicFooter = () => {
    const logoUrl = "/logos/elenem-sport.png";
    const currentYear = new Date().getFullYear();
    return (
        <footer id="footer" className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-t border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <Link href="/" className="flex items-center gap-3">
                <Image src={logoUrl} alt="Elenem Logo" width={120} height={48} className="object-contain" />
            </Link>
            <p className="text-slate-500 mt-3">Le logiciel qui alimente les ligues et fédérations indépendantes en Afrique et au-delà.</p>
          </div>
          <div>
            <div className="font-medium mb-2">Explorer</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link href="/games" className="hover:underline">Matchs</Link></li>
              <li><Link href="/tenants" className="hover:underline">Ligues</Link></li>
              <li><Link href="/news" className="hover:underline">Actualités</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Produit</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link href="/features" className="hover:underline">Fonctionnalités</Link></li>
              <li><Link href="/pricing" className="hover:underline">Tarifs</Link></li>
              <li><Link href="/api" className="hover:underline">API</Link></li>
              <li><Link href="/docs" className="hover:underline">Docs</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Entreprise</div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link href="/about" className="hover:underline">À propos</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
              <li><Link href="/legal" className="hover:underline">Légal</Link></li>
              <li><Link href="/terms" className="hover:underline">Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-6 text-xs text-slate-500 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div>© {currentYear} Elenem. Tous droits réservés.</div>
          <div className="opacity-80">Conçu pour mobile • Prêt pour PWA</div>
        </div>
      </footer>
    );
};