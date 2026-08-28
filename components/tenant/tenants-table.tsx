//components/tenant/tenants-table.tsx
"use client";

import { TenantDetails } from '@/schemas';
import React from 'react';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/';
import Link from 'next/link';
import { ArrowUpDown, Pencil, Trash, MoreVertical } from 'lucide-react';
import TenantLogo from './tenant-logo';
//import { useContextualLink } from '@/hooks/useContextualLink'; // Your custom hook (mocked below)
type SortableColumn = 'name' | 'tenantCode' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt';

interface TenantsTableProps { 
  tenants: TenantDetails[];
  onSort: (sortBy: SortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (tenantId: string) => void;
  // onEdit and onView would typically be handled by Next.js Link
}

export function TenantsTable({ tenants, onSort, sortBy, sortOrder, onDelete }: TenantsTableProps) {
  //const { buildLink } = useContextualLink(); // Keep if your real app uses it

  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (tenants.length === 0) {
    return <p className="text-center text-ink-muted mt-8">No tenants found matching your criteria.</p>;
  }

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
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('tenantCode')}>
                Code {getSortIndicator('tenantCode')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('sportType')}>
                Sport Type {getSortIndicator('sportType')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('country')}>
                Country {getSortIndicator('country')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('ownerUsername')}>
                Owner {getSortIndicator('ownerUsername')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-surface divide-y divide-line">
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tenant.isActive ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {tenant.businessProfile.logoAsset?.url && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <TenantLogo
                        src={tenant.businessProfile.logoAsset.url}
                        alt={`${tenant.name} Logo`}
                        fallbackText={tenant.name.charAt(0)}
                      />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-ink">
                      <Link
                        href={`/tenant/dashboard?ctxTenantId=${tenant.id}`}
                        className="text-accent-text hover:text-indigo-900"
                      >
                        {tenant.name}
                      </Link>
                    </div>
                    <div className="text-sm text-ink-muted">{tenant.tenantCode}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">{tenant.tenantCode}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">{tenant.sportType}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">{tenant.country}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-ink">
                  {tenant.owner ? (
                    <Link href={`/admin/users/${tenant.owner.id}`}>
                      {tenant.owner.username}
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
                      <Link href={`/admin/tenants/${tenant.id}`} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View Tenant
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(tenant.id)} className="flex items-center text-negative cursor-pointer">
                      <Trash className="mr-2 h-4 w-4" /> Delete Tenant
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
