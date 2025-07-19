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

  const contextTenantId = searchParams.get('ctxTenantId');
  const contextLeagueId = searchParams.get('ctxLeagueId');
  const contextTeamId = searchParams.get('ctxTeamId');
  const contextGameId = searchParams.get('ctxGameId');

  const buildLink = (basePath: string, overrideParams: Record<string, string> = {}): string => {
    const contextualParams = new URLSearchParams();

    if (contextTenantId) contextualParams.set('ctxTenantId', contextTenantId);
    if (contextLeagueId) contextualParams.set('ctxLeagueId', contextLeagueId);
    if (contextTeamId) contextualParams.set('ctxTeamId', contextTeamId);
    if (contextGameId) contextualParams.set('ctxGameId', contextGameId);

    // Override or append custom values
    Object.entries(overrideParams).forEach(([key, value]) => {
      contextualParams.set(key, value);
    });

    const queryString = contextualParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return { buildLink };
};