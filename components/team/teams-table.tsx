// components/team/teams-table.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useContextualLink } from '@/hooks/useContextualLink'; // Your custom hook
import {
  Button,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/'; // Your UI components
import { Roles} from '@/schemas'; // Import enums
import { TeamDetails } from '@/schemas'; // Adjust path to your DTOs
import { ArrowUpDown, MoreVertical, Pencil, Trash } from 'lucide-react';
import Image from 'next/image';

type SortableColumn = 'name' | 'shortCode' | 'leagueName' | 'tenantName' | 'country' | 'city' | 'establishedYear' | 'createdAt' | 'updatedAt';

interface TeamsTableProps {
  teams: TeamDetails[];
  onSort: (sortBy: SortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (teamId: string) => void;
  currentUserRoles: Roles[];
  currentTenantId?: string | null;
  currentLeagueId?: string | null;
}

export function TeamsTable({ teams, onSort, sortBy, sortOrder, onDelete, currentUserRoles, currentTenantId, currentLeagueId }: TeamsTableProps) {
  const { buildLink } = useContextualLink();
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (teams.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No teams found matching your criteria.</p>;
  }

  // Function to build the dashboard link dynamically
  const buildTeamDashboardLink = (team: TeamDetails) => {
    const link = `/team/dashboard`;
    const params = new URLSearchParams();

    if (isSystemAdmin) {
      params.append('ctxTenantId', team.tenantId);
      params.append('ctxLeagueId', team.leagueId);
      params.append('ctxTeamId', team.id);
    } else if (isTenantAdmin && currentTenantId === team.tenantId) {
      //params.append('ctxTenantId', team.tenantId);
      params.append('ctxLeagueId', team.leagueId);
      params.append('ctxTeamId', team.id);
    } else if (isLeagueAdmin && currentLeagueId === team.leagueId) {
      //params.append('ctxTenantId', team.tenantId); // League Admin also has tenant context
      //params.append('ctxLeagueId', team.leagueId);
      params.append('ctxTeamId', team.id);
    } else {
      // For Team Admin, the context is usually derived from their user object,
      // so the link might just be /team/dashboard or /team/dashboard?ctxTeamId=...
      // For this table, we assume it's for higher-level admins listing teams.
      // If a Team Admin is viewing this table, their own team's link would be simpler.
      // params.append('ctxTeamId', team.id); // Fallback for direct team access
    }

    return `${link}?${params.toString()}`;
  };

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('name')}>
                Name {getSortIndicator('name')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('shortCode')}>
                Code {getSortIndicator('shortCode')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {(isSystemAdmin || isTenantAdmin) && ( // Show Tenant column for SA/TA
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button variant="ghost" onClick={() => onSort('tenantName')}>
                  Tenant {getSortIndicator('tenantName')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            )}
            {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && ( // Show League column for SA/TA/LA
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button variant="ghost" onClick={() => onSort('leagueName')}>
                  League {getSortIndicator('leagueName')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            )}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sport Type
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gender
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('country')}>
                Country {getSortIndicator('country')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('establishedYear')}>
                Est. Year {getSortIndicator('establishedYear')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team Admin
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {team.businessProfile.logoUrl && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <Image
                        className='h-10 w-10 rounded-full object-cover border border-gray-400'
                        src={team.businessProfile.logoUrl}
                        height={60}
                        width={60}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
                        alt={`${team.shortCode} Logo`}
                        // onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}`; }}
                      />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        href={buildTeamDashboardLink(team)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {team.name}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">{team.slug}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.shortCode || 'N/A'}</div>
              </TableCell>
              {(isSystemAdmin || isTenantAdmin) && (
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {team.tenant ? (
                      <Link href={buildLink(`/admin/tenants/${team.tenant.id}`)} className="text-primary-600 hover:text-primary-800">
                        {team.tenant.name}
                      </Link>
                    ) : 'N/A'}
                  </div>
                </TableCell>
              )}
              {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && (
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {team.league ? (
                      <Link href={buildLink(`/admin/leagues/${team.league.id}`)} className="text-primary-600 hover:text-primary-800">
                        {team.league.name} ({team.league.leagueCode})
                      </Link>
                    ) : 'N/A'}
                  </div>
                </TableCell>
              )}
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.tenant?.sportType || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.league?.gender || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.league?.division || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.country || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{team.establishedYear || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {team.managers && team.managers.length > 0 ? (
                    <Link href={buildLink(`/admin/users/${team.managers[0].id}`)} className="text-primary-600 hover:text-primary-800">
                      {team.managers[0].username}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={buildLink(`/admin/teams/edit/${team.id}`)} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View/Edit
                      </Link>
                    </DropdownMenuItem>
                    {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && ( // Only higher admins can delete
                      <DropdownMenuItem onClick={() => onDelete(team.id)} className="flex items-center text-red-600 cursor-pointer">
                        <Trash className="mr-2 h-4 w-4" /> Delete Team
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}