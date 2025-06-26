// components/league/leagues-table.tsx
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

// Your League-specific types from prisma
import { LeagueBasic, Gender, SportType, LeagueVisibility } from '@/prisma/'; // Assuming LeagueBasic is here

// Icons from Lucide React
import { ArrowUpDown, Pencil, Trash, MoreVertical } from 'lucide-react';


type SortableColumn = 'name' | 'leagueCode' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'division' | 'establishedYear';

interface LeaguesTableProps {
  leagues: LeagueBasic[];
  onSort: (sortBy: SortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (leagueId: string) => void;
  // onEdit and onView would typically be handled by Next.js Link directly within the table
}

export function LeaguesTable({ leagues, onSort, sortBy, sortOrder, onDelete }: LeaguesTableProps) {
  const { buildLink } = useContextualLink();

  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (leagues.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No leagues found matching your criteria.</p>;
  }

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
              <Button variant="ghost" onClick={() => onSort('leagueCode')}>
                Code {getSortIndicator('leagueCode')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('sportType')}>
                Sport {getSortIndicator('sportType')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('country')}>
                Country {getSortIndicator('country')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('division')}>
                Division {getSortIndicator('division')}
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
              Owner
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {leagues.map((league) => (
            <TableRow key={league.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  league.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {league.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {league.logoUrl && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={league.logoUrl}
                        alt={`${league.name} Logo`}
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${league.name.charAt(0)}`; }}
                      />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        href={buildLink(`/admin/leagues/${league.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {league.name}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">{league.slug}</div> {/* Display slug or leagueCode as subtitle */}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{league.leagueCode}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {league.tenant ? (
                    <Link href={buildLink(`/admin/tenants/${league.tenant.id}`)}>
                      {league.tenant.name}
                    </Link>
                  ) : 'N/A'}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{league.sportType}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{league.country || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{league.division}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{league.establishedYear || 'N/A'}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {league.owner ? (
                    <Link href={buildLink(`/admin/users/${league.owner.id}`)}>
                      {league.owner.username}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={buildLink(`/admin/leagues/${league.id}/edit`)} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View/Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(league.id)} className="flex items-center text-red-600 cursor-pointer">
                      <Trash className="mr-2 h-4 w-4" /> Delete League
                    </DropdownMenuItem>
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
