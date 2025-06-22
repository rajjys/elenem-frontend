// components/tenant/tenant-table.tsx
"use client";

import React from 'react';
import { TenantBasic } from '@/prisma'; // Import your TenantBasic DTO
import Link from 'next/link';
import { useContextualLink } from '@/hooks/useContextualLink'; // Your custom hook
import { Button } from '@/components/ui/button'; // Assuming Button component for consistent styling

interface TenantTableProps {
  tenants: TenantBasic[];
  onEdit: (tenantId: string) => void; // Keeping onEdit prop for now, though link handles it
  onDelete: (tenantId: string) => void;
}

export function TenantTable({ tenants, onEdit, onDelete }: TenantTableProps) {
  const { buildLink } = useContextualLink();

  if (tenants.length === 0) {
    return <p className="text-center text-gray-500">No tenants found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {tenant.logoUrl && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full object-cover" src={tenant.logoUrl} alt={`${tenant.name} Logo`} onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${tenant.name.charAt(0)}`; }} />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {/* Link to tenant-specific dashboard, using contextTenantId for context */}
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {tenant.name}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">{tenant.tenantCode}</div> {/* Changed from slug to tenantCode for display */}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tenant.tenantCode}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tenant.sportType}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {/* Updated Edit Link: Use Next.js Link component to the new edit page */}
                <Link
                  href={`/admin/tenants/${tenant.id}/edit`}
                  className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </Link>
                <Button
                  onClick={() => onDelete(tenant.id)}
                  variant="danger" // Assuming a destructive variant for your Button component
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}