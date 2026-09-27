'use client';
import { useEffect, useState } from 'react';
import { Home, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/brand';
import Link from 'next/link';
import { homeForRoles } from '@/utils/post-auth-redirect';
import { readSessionRoles } from '@/utils/session-hint';

/**
 * The root 404. It sits in the root layout's tree, so its JavaScript ships with every page of the
 * product site: it reads the session from the cookie rather than the auth store (which brought
 * zustand, axios and zod along), and uses one icon library, not two.
 */
export default function NotFound() {
  const [roles, setRoles] = useState<string[] | null>(null);
  useEffect(() => setRoles(readSessionRoles()), []);
  const dashboardLink = roles ? homeForRoles(roles) : null;
  return (
    <div className="min-h-screen bg-surface-sunk flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center mb-4 pb-8">
        <Logo className="text-2xl" markClassName="h-10 w-10 text-lg" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-caution"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-3xl font-extrabold text-ink">
            Page introuvable
          </h2>
        </div>

        <div className="mt-4 bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-ink-muted mb-6">
              La page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-8">
              <Link href="/" className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-accent-text bg-surface hover:bg-surface-sunk hover:text-accent-text transition-all duration-300 ease-in-out">
                <Home className="w-5 h-5" />
                <span className="pl-2">Page d&apos;accueil</span>
              </Link>
              {dashboardLink && (
                <Link href={dashboardLink} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-accent-ink bg-accent hover:bg-accent-hover transition-all duration-300 ease-in-out">
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="pl-2">Tableau de bord</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-ink-muted">
          <p>
            Besoin d&apos;aide?{' '}
            <Link
              href="mailto:contact@dxscores.com"
              className="font-medium text-accent-text hover:text-accent-text"
            >
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
