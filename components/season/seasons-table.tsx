// components/season/seasons-table.tsx
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

import { SeasonStatus, Roles, SeasonSortableColumn, SeasonDetails } from '@/schemas'; // Your Season DTO

import { ArrowUpDown, Pencil, Trash, MoreVertical } from 'lucide-react';

//type SortableColumn = 'name' | 'startDate' | 'endDate' | 'status' | 'createdAt' | 'updatedAt' | 'leagueName' | 'tenantName';

interface SeasonsTableProps {
  seasons: SeasonDetails[];
  onSort: (sortBy: SeasonSortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (seasonId: string) => void;
  currentUserRoles: Roles[];
  currentTenantId?: string | null;
  currentLeagueId?: string | null;
}

export function SeasonsTable({ seasons, onSort, sortBy, sortOrder, onDelete, currentUserRoles, currentTenantId, currentLeagueId }: SeasonsTableProps) {
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

  if (seasons.length === 0) {
    return <p className="text-center text-ink-muted mt-8">No seasons found matching your criteria.</p>;
  }

  // Function to build the dashboard link dynamically
  const buildSeasonDashboardLink = (season: SeasonDetails) => {
  const link = `/season/dashboard`;
    const params = new URLSearchParams();

    if (isSystemAdmin) {
      params.append('ctxTenantId', season.tenantId);
      params.append('ctxLeagueId', season.leagueId);
      params.append('ctxSeasonId', season.id);
    } else if (isTenantAdmin && currentTenantId === season.tenantId) {
      params.append('ctxTenantId', season.tenantId);
      params.append('ctxLeagueId', season.leagueId);
      params.append('ctxSeasonId', season.id);
    } else if (isLeagueAdmin && currentLeagueId === season.leagueId) {
      params.append('ctxTenantId', season.tenantId); // League Admin also has tenant context
      params.append('ctxLeagueId', season.leagueId);
      params.append('ctxSeasonId', season.id);
    } else {
      // Fallback: If no specific admin role matches, just provide seasonId
      // This might happen if a user with no specific admin role somehow accesses this table
      params.append('ctxSeasonId', season.id);
    }

    return `${link}?${params.toString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <Table>
        <TableHeader className="bg-surface-sunk">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('name')}>
                Name {getSortIndicator('name')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {(isSystemAdmin || isTenantAdmin) && ( // Show Tenant column for SA/TA
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
                <Button variant="ghost" onClick={() => onSort('tenantName')}>
                  Tenant {getSortIndicator('tenantName')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            )}
            {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && ( // Show League column for SA/TA/LA
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
                <Button variant="ghost" onClick={() => onSort('leagueName')}>
                  League {getSortIndicator('leagueName')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            )}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('startDate')}>
                Start Date {getSortIndicator('startDate')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('endDate')}>
                End Date {getSortIndicator('endDate')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Season Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-surface divide-y divide-line">
          {seasons.map((season) => (
            <TableRow key={season.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  season.isActive ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'
                }`}>
                  {season.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-ink">
                  <Link
                    href={buildSeasonDashboardLink(season)}
                    className="text-accent-text hover:text-accent-text"
                  >
                    {season.name}
                  </Link>
                </div>
                <div className="text-sm text-ink-muted">{season.slug}</div>
              </TableCell>
              {(isSystemAdmin || isTenantAdmin) && (
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-ink">
                    {season.tenant ? (
                      <Link href={buildLink(`/admin/tenants/${season.tenant.id}`)} className="text-accent-text hover:text-accent-text">
                        {season.tenant.name}
                      </Link>
                    ) : 'N/A'}
                  </div>
                </TableCell>
              )}
              {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && (
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-ink">
                    {season.league ? (
                      <Link href={buildLink(`/admin/leagues/${season.league.id}`)} className="text-accent-text hover:text-accent-text">
                        {season.league.name} ({season.league.slug})
                      </Link>
                    ) : 'N/A'}
                  </div>
                </TableCell>
              )}
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">{formatDate(season.startDate)}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">{formatDate(season.endDate)}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  season.status === SeasonStatus.ACTIVE ? 'bg-accent-soft text-accent-text' :
                  season.status === SeasonStatus.COMPLETED ? 'bg-surface-sunk text-ink' :
                  'bg-caution-soft text-caution'
                }`}>
                  {season.status.replace(/_/g, ' ')}
                </span>
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
                      <Link href={buildLink(`/season/edit/${season.id}`)} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View/Edit
                      </Link>
                    </DropdownMenuItem>
                    {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && ( // Only higher admins can delete
                      <DropdownMenuItem onClick={() => onDelete(season.id)} className="flex items-center text-negative cursor-pointer">
                        <Trash className="mr-2 h-4 w-4" /> Delete Season
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
