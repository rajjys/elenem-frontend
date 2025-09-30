'use client'
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardTitle, Skeleton, Button } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { LeagueBasic, Roles, TeamDetails, TeamDetailsSchema, TenantDetails } from '@/schemas';
import { api } from '@/services/api';
import { TenantDetailsSchema, LeagueBasicSchema } from '@/schemas';
import { Plus } from 'lucide-react';

const GeneralUserDashboard = () => {
  const { user: userAuth, fetchUser } = useAuthStore();
  const [loadingUser, setLoadingUser] = useState(true);

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [league, setLeague] = useState<LeagueBasic>(null);
  const [team, setTeam] = useState<TeamDetails | null>(null);

  const isSystemAdmin = userAuth?.roles?.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = userAuth?.roles?.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = userAuth?.roles?.includes(Roles.LEAGUE_ADMIN);
  const isTeamAdmin = userAuth?.roles?.includes(Roles.TEAM_ADMIN);
  const isGeneralUser = userAuth?.roles?.includes(Roles.GENERAL_USER);

  // Fetch user on mount if needed
  useEffect(() => {
    const loadUser = async () => {
      try {
        await fetchUser();
      } finally {
        setLoadingUser(false);
      }
    };
    if (!userAuth) loadUser();
    else setLoadingUser(false);
  }, [userAuth, fetchUser]);

  // Fetch entity data depending on role
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isTenantAdmin && userAuth?.tenantId) {
          const response = await api.get(`/tenants/${userAuth.tenantId}`);
          setTenant(TenantDetailsSchema.parse(response.data));
        }
        if (isLeagueAdmin && userAuth?.managingLeagueId) {
          const response = await api.get(`/leagues/${userAuth.managingLeagueId}`);
          setLeague(LeagueBasicSchema.parse(response.data));
        }
        if (isTeamAdmin && userAuth?.managingTeamId) {
          const response = await api.get(`/teams/${userAuth.managingTeamId}`);
          setTeam(TeamDetailsSchema.parse(response.data));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    if (userAuth) fetchData();
  }, [userAuth, isTenantAdmin, isLeagueAdmin, isTeamAdmin]);

  return (
    <div>
      <h1 className="text-xl md:text-2xl lg:text-3xl">
        Bienvenue
        <span className="bg-gradient-to-r from-blue-500 via-green-600 to-purple-700 bg-clip-text text-transparent ml-2 pr-2 border-b-2 border-gray-400">
          {userAuth?.firstName}
        </span>
      </h1>

      <div className="my-4">
        {loadingUser ? (
          <Card className="space-x-2 md:p-4 max-w-xl">
            <div className="flex items-center my-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-10 w-full rounded ml-4" />
            </div>
            <Skeleton className="h-36 w-full rounded" />
          </Card>
        ) : (
          <>
            {/* General User without tenant */}
            {isGeneralUser && !userAuth?.tenantId && (
              <div className="my-6 text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors rounded-md w-auto max-w-xs text-center">
                <Link href="/tenant/create" className=''>
                  <div className='flex items-center justify-center pt-6'><Plus className='w-8 h-8' /></div>
                  <div className="text-lg font-bold px-6 pt-3 pb-6">
                    Créez Votre Organisation
                  </div>
                </Link>
              </div>
            )}
            {/* General User with tenant OR Tenant Admin */}
            {(isGeneralUser && userAuth?.tenantId) || isTenantAdmin ? (
              <Card className='my-6 text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors rounded-md w-auto max-w-xs text-center'>
                <CardTitle className="flex items-center">
                  <Image
                    src={tenant?.businessProfile.logoAsset?.url || `https://placehold.co/40x40/4F46E5/FFFFFF?text=${tenant?.name || 'T'}`}
                    alt="Tenant Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-contain"
                  />
                  <span className="text-lg p-2">{tenant?.name || userAuth?.tenant?.name}</span>
                </CardTitle>
                <CardContent className='py-4'>
                  <Link href="/tenant/dashboard">Go to Tenant Dashboard</Link>
                </CardContent>
              </Card>
            ) : null}

            {/* League Admin */}
            {isLeagueAdmin && league && (
              <Card>
                <CardTitle>{league.name}</CardTitle>
                <CardContent>
                  <Link href="/league/dashboard">Go to League Dashboard</Link>
                </CardContent>
              </Card>
            )}

            {/* Team Admin */}
            {isTeamAdmin && team && (
              <Card>
                <CardTitle>{team.name}</CardTitle>
                <CardContent>
                  <Link href="/team/dashboard">Go to Team Dashboard</Link>
                </CardContent>
              </Card>
            )}

            {/* System Admin */}
            {isSystemAdmin && (
              <div className="text-center my-6">
                <Link href="/admin/dashboard">
                  <Button className="text-lg font-bold px-6 py-3">
                    Tableau de Bord du Système / System Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GeneralUserDashboard;
