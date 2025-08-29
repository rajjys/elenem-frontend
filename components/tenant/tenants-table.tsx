//components/tenant/tenants-table.tsx
"use client";

import { TenantBasic } from '@/schemas';
import React from 'react';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/';
import Link from 'next/link';
import { ArrowUpDown, Pencil, Trash, MoreVertical } from 'lucide-react';
import TenantLogo from './tenant-logo';
//import { useContextualLink } from '@/hooks/useContextualLink'; // Your custom hook (mocked below)
type SortableColumn = 'name' | 'tenantCode' | 'sportType' | 'country' | 'ownerUsername' | 'createdAt' | 'updatedAt';

interface TenantsTableProps { 
  tenants: TenantBasic[];
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
    return <p className="text-center text-gray-500 mt-8">No tenants found matching your criteria.</p>;
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
              <Button variant="ghost" onClick={() => onSort('tenantCode')}>
                Code {getSortIndicator('tenantCode')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('sportType')}>
                Sport Type {getSortIndicator('sportType')}
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
              <Button variant="ghost" onClick={() => onSort('ownerUsername')}>
                Owner {getSortIndicator('ownerUsername')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {tenant.logoUrl && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <TenantLogo
                        src={tenant.logoUrl}
                        alt={`${tenant.name} Logo`}
                        fallbackText={tenant.name.charAt(0)}
                      />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      <Link
                        href={`/tenant/dashboard?ctxTenantId=${tenant.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {tenant.name}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">{tenant.tenantCode}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tenant.tenantCode}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tenant.sportType}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tenant.country}</div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
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
                    <DropdownMenuItem onClick={() => onDelete(tenant.id)} className="flex items-center text-red-600 cursor-pointer">
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
