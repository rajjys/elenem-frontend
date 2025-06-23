// hooks/useContextualLink.ts
"use client";

import { useSearchParams } from 'next/navigation';

/**
 * A custom hook to generate context-aware links for the admin panels.
 * It reads context IDs (tenantId, leagueId, teamId) from the URL search 
 * parameters and constructs the appropriate query string to maintain context 
 * across navigation.
 */
export const useContextualLink = () => {
  const searchParams = useSearchParams();

  const contextTenantId = searchParams.get('tenantId');
  const contextLeagueId = searchParams.get('leagueId');
  const contextTeamId = searchParams.get('teamId');

  /**
   * Builds a complete, context-aware URL.
   * @param basePath The base path of the link (e.g., '/league/games').
   * @returns The full path including any necessary context query parameters.
   */
  const buildLink = (basePath: string): string => {
    const contextualParams = new URLSearchParams();

    if (contextTenantId) {
      contextualParams.set('tenantId', contextTenantId);
    }
    if (contextLeagueId) {
      contextualParams.set('leagueId', contextLeagueId);
    }
    if (contextTeamId) {
      contextualParams.set('teamId', contextTeamId);
    }

    const queryString = contextualParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return { buildLink };
};
