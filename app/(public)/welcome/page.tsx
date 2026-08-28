'use client'
import { Roles } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";

export default function WelcomePage() {
    const { user:userAuth } = useAuthStore();
    const canCreateTenant = userAuth?.roles.includes(Roles.GENERAL_USER) && !userAuth.tenantId;
  return (
    <div className="min-h-screen bg-surface-sunk flex flex-col items-center py-12 px-4">
      {/* Hero */}
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-3xl font-bold text-ink ">
          Bienvenue, {userAuth?.firstName ? 
                                            userAuth.firstName.charAt(0).toUpperCase() + userAuth.firstName.slice(1)
                                          : 'cher utilisateur'}! 👋
        </h1>
        <p className="mt-2 text-ink-muted ">
          Commençons. Vous pouvez créer votre organisation, gérer votre compte ou simplement explorer ce qui se passe sur la plateforme.
        </p>
      </div>
      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Créer une organisation */}
        <div className="bg-surface rounded-2xl shadow-sm p-6 flex flex-col items-start">
          <div className="text-4xl mb-4">🏟️</div>
          <h2 className="text-xl font-semibold mb-2 text-ink ">Créer votre organisation</h2>
          <p className="text-ink-muted mb-4">
            Configurez votre Organisation, ligues et équipes en quelques étapes et commencez à gérer vos matchs, vos classements et plus encore.
          </p>
          {
            canCreateTenant ? 
            <Link
                href="/tenant/create"
                className="mt-auto inline-block bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent">
                Créer une organisation →
            </Link>
            :
            <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-ink-subtle bg-surface-sunk cursor-not-allowed"
                  aria-disabled="true"
                  tabIndex={-1}>
                    Créer une organisation →
            </span>
          }
        </div>

        {/* Tableau de bord */}
        <div className="bg-surface rounded-2xl shadow-sm p-6 flex flex-col items-start">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-xl font-semibold mb-2 text-ink ">Continuer comme utilisateur</h2>
          <p className="text-ink-muted mb-4">
            Parcourez du contenu personnalisé et gérez votre compte sans créer d’organisation pour le moment.
          </p>
          <Link
            href="/account/dashboard"
            className="mt-auto inline-block bg-surface-sunk text-ink px-4 py-2 rounded-lg font-medium hover:bg-line "
          >
            Aller à mon tableau de bord
          </Link>
        </div>
      </div>

      {/* Explorer */}
      <div className="max-w-4xl w-full mt-12">
        <h3 className="text-lg font-semibold text-ink mb-4 text-center">
          Ou explorez ce qui se passe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/tenants"
            className="bg-surface rounded-2xl shadow-sm p-6 flex flex-col items-start hover:bg-surface-sunk "
          >
            <div className="text-3xl mb-3">🏢</div>
            <h4 className="text-lg font-semibold mb-1 text-ink ">Explorer les organisations</h4>
            <p className="text-ink-muted text-sm">
              Découvrez les clubs, ligues et équipes déjà présents sur la plateforme.
            </p>
          </Link>

          <Link
            href="/games"
            className="bg-surface rounded-2xl shadow-sm p-6 flex flex-col items-start hover:bg-surface-sunk "
          >
            <div className="text-3xl mb-3">📅</div>
            <h4 className="text-lg font-semibold mb-1 text-ink ">Parcourir le calendrier</h4>
            <p className="text-ink-muted text-sm">
              Consultez les matchs à venir, les résultats et les plannings des différentes organisations.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
