// components/user/users-table.tsx
"use client";

import React from 'react';
import { User, Role, UserBasic } from '@/schemas';
import Link from 'next/link';
import { ArrowUpDown, Pencil, Trash, MoreVertical } from 'lucide-react';
import {
  Button,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/';

type SortableColumn = "firstName" | "lastName" | "username" | "email" | "createdAt" | "updatedAt" | "lastLoginAt";
interface UsersTableProps {
  users: UserBasic[];
  onSort: (sortBy: SortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (userId: string) => void;
  onManageRoles: (userId: string) => void;
  // onEdit and onView would typically be handled by Next.js Link
}

export function UsersTable({ users, onSort, sortBy, sortOrder, onDelete, onManageRoles }: UsersTableProps) {

  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (users.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No users found matching your criteria.</p>;
  }

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('firstName')}>
                First Name {getSortIndicator('firstName')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('lastName')}>
                Last Name {getSortIndicator('lastName')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('email')}>
                Email {getSortIndicator('email')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('username')}>
                Username {getSortIndicator('username')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roles
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {user.avatarUrl && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName} Profile`}
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${user.username.charAt(0)}`; }}
                      />
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastName}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.username}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.roles.map(role => role.replace(/_/g, ' ')).join(', ')}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
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
                      <Link href={`/admin/users/${user.id}/`} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View/Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManageRoles(user.id)} className="flex items-center cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Manage Roles
                    </DropdownMenuItem>
                    {/* Add more actions like view full profile */}
                    <DropdownMenuItem onClick={() => onDelete(user.id)} className="flex items-center text-red-600 cursor-pointer">
                      <Trash className="mr-2 h-4 w-4" /> Delete User
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
