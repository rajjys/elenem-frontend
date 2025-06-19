// hooks/useContextualLink.ts
"use client";

import { useSearchParams } from 'next/navigation';

/**
 * A custom hook to generate context-aware links for the admin panels.
 * It reads context IDs (tenantId, leagueId, teamId) from the URL search 
 * parameters and constructs the appropriate query string to maintain context 
 * across navigation within the admin panels.
 *
 * This allows a higher-level admin (like a TENANT_ADMIN) to navigate a 
 * lower-level layout (like LeagueAdminLayout) while preserving the context of 
 * which league they are viewing.
 *
 * @returns A function `buildLink` that takes a base path (e.g., '/league/games')
 * and returns a full, context-aware path including the necessary query parameters.
 */
export const useContextualLink = () => {
  const searchParams = useSearchParams();

  // Extract all potential context IDs from the current URL's query string.
  const contextTenantId = searchParams.get('contextTenantId');
  const contextLeagueId = searchParams.get('contextLeagueId');
  const contextTeamId = searchParams.get('contextTeamId');

  /**
   * Builds a complete, context-aware URL.
   * @param basePath The base path of the link (e.g., '/league/games').
   * @returns The full path including any necessary context query parameters.
   */
  const buildLink = (basePath: string): string => {
    // This will hold our context query parameters.
    const contextualParams = new URLSearchParams();

    // If we are in a tenant context (e.g., a SYSTEM_ADMIN viewing a tenant), preserve it.
    if (contextTenantId) {
      contextualParams.set('contextTenantId', contextTenantId);
    }
    
    // If we are in a league context, preserve it.
    if (contextLeagueId) {
      contextualParams.set('contextLeagueId', contextLeagueId);
    }
    
    // If we are in a team context, preserve it.
    if (contextTeamId) {
      contextualParams.set('contextTeamId', contextTeamId);
    }

    const queryString = contextualParams.toString();

    // If there are any context parameters, append them to the base path.
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return { buildLink };
};
