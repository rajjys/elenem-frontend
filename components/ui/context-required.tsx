'use client';

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from './button';
import { useCurrentUser } from '@/hooks';
import { Roles } from '@/schemas';

/**
 * Shown when a screen needs a scope it cannot resolve.
 *
 * Routes here are flat, so `/league/teams` says nothing about *which* league. When no
 * `ctxLeagueId` is present and the signed-in user does not own one, the old behaviour was to fall
 * back to whatever the role permitted — which is how a tenant admin ended up seeing all 220
 * players in the organisation on a page titled "Joueurs de la ligue". Silently showing the wrong
 * scope is worse than showing nothing: the numbers look authoritative and are answering a
 * different question.
 *
 * So: say what is missing and offer the way back.
 */
export function ContextRequired({
  what = 'cette ressource',
  description,
}: {
  /** e.g. "une ligue", "une équipe" */
  what?: string;
  description?: string;
}) {
  const user = useCurrentUser();
  const roles = user?.roles ?? [];

  const home = roles.includes(Roles.SYSTEM_ADMIN)
    ? '/admin/dashboard'
    : roles.includes(Roles.TENANT_ADMIN)
      ? '/tenant/dashboard'
      : roles.includes(Roles.LEAGUE_ADMIN)
        ? '/league/dashboard'
        : roles.includes(Roles.TEAM_ADMIN)
          ? '/team/dashboard'
          : '/account/dashboard';

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <Compass className="mx-auto mb-4 h-9 w-9 text-ink-subtle" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-ink">Aucun contexte sélectionné</h2>
      <p className="mx-auto mt-2 text-sm text-ink-muted">
        {description ??
          `Cette page a besoin de savoir de quelle ${what} il s'agit. Ouvrez-la depuis la liste correspondante plutôt que par un lien direct.`}
      </p>
      <Button variant="primary" className="mt-5" asChild>
        <Link href={home}>Retour à mon tableau de bord</Link>
      </Button>
    </div>
  );
}
