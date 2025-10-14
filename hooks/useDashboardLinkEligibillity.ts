import { Roles } from "@/schemas";

// Place this inside your AppLayout component (or export from a helper file)
export function useDashboardLinkEligibillity(roles: Roles[] | undefined , currentPath: string): boolean {
  if (!roles) return false;

    const isSystemAdmin = roles.includes(Roles.SYSTEM_ADMIN);
    const isTenantAdmin = roles.includes(Roles.TENANT_ADMIN);
    const isLeagueAdmin = roles.includes(Roles.LEAGUE_ADMIN);
    const isTeamAdmin   = roles.includes(Roles.TEAM_ADMIN);
    const isPlayer      = roles.includes(Roles.PLAYER);
    const isCoach       = roles.includes(Roles.COACH);
    const isReferee     = roles.includes(Roles.REFEREE)

    const isAtHome = isSystemAdmin && currentPath.startsWith("/admin")   ? true :
                     isTenantAdmin && currentPath.startsWith("/tenant")  ? true :
                     isLeagueAdmin && currentPath.startsWith("/league")  ? true :
                     isTeamAdmin   && currentPath.startsWith("/team")    ? true :
                     isCoach       && currentPath.startsWith("/coach")   ? true :
                     isPlayer      && currentPath.startsWith("/player")  ? true :
                     isReferee     && currentPath.startsWith("/referee") ? true :
                     false;
  return !isAtHome;
}