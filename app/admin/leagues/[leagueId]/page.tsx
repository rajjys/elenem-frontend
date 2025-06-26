// app/admin/leagues/[id]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { LeagueDetails, Role } from '@/prisma/'; // Adjust import path
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
//import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { Badge } from '@/components/ui';


export default function LeagueProfilePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (user) {
      const isSystemAdmin = user.roles.includes(Role.SYSTEM_ADMIN);
      const isTenantAdmin = user.roles.includes(Role.TENANT_ADMIN);

      if (!isSystemAdmin && !isTenantAdmin && !user.roles.includes(Role.LEAGUE_ADMIN)) {
        toast.error("Unauthorized", { description: "You do not have permission to view league details." });
        router.push('/dashboard');
        return;
      }

      const fetchLeague = async () => {
        try {
          const response = await api.get<LeagueDetails>(`/leagues/${leagueId}`);
          setLeague(response.data);

          // Determine if user can edit this specific league
          if (isSystemAdmin) {
            setCanEdit(true);
          } else if (isTenantAdmin && response.data.tenantId === user.tenantId) {
            setCanEdit(true);
          } else if (user.roles.includes(Role.LEAGUE_ADMIN) && response.data.ownerId === user.id) {
            // A League Admin can edit their own leagues
            setCanEdit(true);
          } else {
            setCanEdit(false);
          }
        } catch (error) {
          console.error('Failed to fetch league details:', error);
          toast.error("Failed to load league details.", { description: "League not found or access denied." });
          router.push('/admin/leagues'); // Redirect to leagues list
        } finally {
          setLoading(false);
        }
      };
      fetchLeague();
    } else if (!user) {
      toast.error("Authentication required", { description: "Please log in to view league details." });
      router.push('/login');
    }
  }, [leagueId, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading league profile...</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>League not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">{league.name}</CardTitle>
              <CardDescription className="text-gray-600 mt-1">Code: {league.leagueCode}</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => router.push(`/admin/leagues/edit/${league.id}`)} variant="default">
                Edit League
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {league.bannerImageUrl && (
            <img src={league.bannerImageUrl} alt={`${league.name} banner`} className="w-full h-48 object-cover rounded-md mb-4" />
          )}
          {league.logoUrl && (
            <img src={league.logoUrl} alt={`${league.name} logo`} className="w-24 h-24 object-contain rounded-full border-2 border-gray-200 -mt-20 ml-4 mb-4" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Sport Type</p>
              <p className="text-lg font-semibold">{league.sportType.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Visibility</p>
              <p className="text-lg font-semibold">{league.visibility}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-lg font-semibold">{league.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={league.isActive ? "success" : "destructive"}>
                {league.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {league.tenant && (
              <div>
                <p className="text-sm font-medium text-gray-500">Tenant</p>
                <p className="text-lg font-semibold">{league.tenant.name} ({league.tenant.tenantCode})</p>
              </div>
            )}
            {league.owner && (
              <div>
                <p className="text-sm font-medium text-gray-500">Owner</p>
                <p className="text-lg font-semibold">{league.owner.username} ({league.owner.email})</p>
              </div>
            )}
            {league.parentLeague && (
              <div>
                <p className="text-sm font-medium text-gray-500">Parent League</p>
                <p className="text-lg font-semibold">{league.parentLeague.name}</p>
              </div>
            )}
            {league.division && (
              <div>
                <p className="text-sm font-medium text-gray-500">Division</p>
                <p className="text-lg font-semibold">{league.division}</p>
              </div>
            )}
            {league.establishedYear && (
              <div>
                <p className="text-sm font-medium text-gray-500">Established Year</p>
                <p className="text-lg font-semibold">{league.establishedYear}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-lg font-semibold">
                {league.city ? `${league.city}, ` : ''}
                {league.region ? `${league.region}, ` : ''}
                {league.country}
              </p>
            </div>
          </div>

          {league.description && (
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-base text-gray-800">{league.description}</p>
            </div>
          )}

          {/* Points System Display */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-xl font-bold mb-3">Points System</h3>
            {league.pointSystemConfig?.rules?.length > 0 ? (
              <div className="space-y-2">
                {league.pointSystemConfig.rules.map((rule, index) => (
                  <p key={index} className="text-gray-700">
                    <span className="font-semibold">{rule.outcome.replace(/_/g, ' ')}:</span> {rule.points} points
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No specific point rules defined.</p>
            )}

            {league.pointSystemConfig?.bonusPoints && league.pointSystemConfig.bonusPoints.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Bonus Points</h4>
                <div className="space-y-2">
                  {league.pointSystemConfig.bonusPoints.map((bonus, index) => (
                    <p key={index} className="text-gray-700">
                      <span className="font-semibold">{bonus.condition.replace(/_/g, ' ')}:</span> {bonus.points} points
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tiebreakers Display */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-xl font-bold mb-3">Tiebreakers</h3>
            {league.tieBreakerConfig?.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {league.tieBreakerConfig.map((breaker, index) => (
                  <li key={index} className="text-gray-700">
                    <span className="font-semibold">{breaker.metric.replace(/_/g, ' ')}</span> ({breaker.sort})
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-600">No specific tiebreakers defined.</p>
            )}
          </div>

          <div className="text-sm text-gray-500 mt-6 border-t pt-4">
            <p>Created At: {new Date(league.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(league.updatedAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}