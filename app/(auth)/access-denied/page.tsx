'use client'; // Mark as Client Component since we're using hooks
export const dynamic = "force-dynamic";
import { Roles } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import { Desktop } from '@phosphor-icons/react';
import { LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react'; // Import Suspense from React

// Create a separate component that actually uses useSearchParams
const AccessDeniedContent = () => {
  const params = useSearchParams();
  const reason = params.get('reason');
  const { user: userAuth } = useAuthStore();

  const currentUserRoles = userAuth?.roles || [];
    
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
  const dashboardLink = isSystemAdmin ? "/admin/dashboard":
                        isTenantAdmin ? "/tenant/dashboard" :
                        isLeagueAdmin ? "/league/dashboard" :
                        "/account/dashboard"; // Default fallback path 

  let errorMessage = "Vous n'avez pas la permission d'accéder à cette page.";
  if (reason === 'system_admin_only') errorMessage = "Seuls les administrateurs système peuvent accéder à cette zone.";
  if (reason === 'tenant_admin_only') errorMessage = "Seuls les administrateurs d'organisation peuvent accéder à cette zone.";
  if (reason === 'league_admin_only') errorMessage = "Seuls les administrateurs de ligue peuvent accéder à cette zone.";
if (reason === 'team_admin_only') errorMessage = "Seuls les administrateurs d'équipe peuvent accéder à cette zone.";


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center mb-4 pb-8">
        <Image
          src='/logos/elenem-sport.png'
          alt='Elenem Logo'
          width={180}
          height={120}
          //fallbackText={userAuth?.username.charAt(0) || "Logo"}
        />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Warning icon */}
          <svg
            className="mx-auto h-12 w-12 text-red-500"
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
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Acces Refusé
          </h2>
        </div>

        <div className="mt-4 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              {errorMessage || `You don't have permission to access this page. If you believe this is an error, please contact your administrator.`}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-8">
              <Link href='/' className="flex items-center justify-center  w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 hover:text-blue-700 transition-all duration-300 ease-in-out">
                <Desktop className="w-5 h-5 font-bold" />
                <span className='pl-2'>Page d&apos;accueil</span>
              </Link>
              <Link href={dashboardLink} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-in-out">
                <LayoutDashboard className="w-5 h-5 font-bold" />
                <span className='pl-2'>Tableau de bord</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Besoin d&apos;aide?{' '}
            <Link
              href="mailto:support@yourdomain.com"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// The main page component that renders the content within Suspense
const AccessDeniedPage = () => {
  return (
    <Suspense fallback={<div>Loading access details...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
};

export default AccessDeniedPage;