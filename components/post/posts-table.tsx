// components/post/posts-table.tsx

import React from 'react';
import Link from 'next/link';
import { useContextualLink } from '@/hooks/useContextualLink';
import {
  Button,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { PostResponseDto, PostStatus, Roles } from '@/schemas'; // Assuming PostResponseDto and Roles are imported
import { ArrowUpDown, MoreVertical, Pencil, Trash } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns'; // Utility for date formatting

// Define the sortable columns based on PostResponseDto
type SortableColumn = 'title' | 'type' | 'status' | 'tenantName' | 'leagueName' | 'teamName' | 'createdAt' | 'publishedAt';

interface PostsTableProps {
  posts: PostResponseDto[];
  onSort: (sortBy: SortableColumn) => void;
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  onDelete: (postId: string) => void;
  currentUserRoles: Roles[];
  currentTenantId?: string | null;
  //currentLeagueId?: string | null;
  //currentTeamId?: string | null; // Added for completeness if a Team Admin views it
}

export function PostsTable({ posts, onSort, sortBy, sortOrder, onDelete, currentUserRoles}: PostsTableProps) {
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

  // Helper to build the link to the post edit/view page
  const buildPostLink = (post: PostResponseDto) => {
    // You'll likely need a contextual link here for the post edit page
    // We'll use the tenant-contextual link structure for now.
    // The post slug is great for public viewing, but the ID is better for admin editing.
    return buildLink(`/post/${post.id}`); 
  };
  console.log(posts);

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            {/* 1. Status */}
            <TableHead className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('status')}>
                Status {getSortIndicator('status')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {/* 2. Title */}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('title')}>
                Title {getSortIndicator('title')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {/* 3. Type */}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('type')}>
                Type {getSortIndicator('type')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {/* 4. Tenant (Visible to SA/TA) */}
            {(isSystemAdmin || isTenantAdmin) && (
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button variant="ghost" onClick={() => onSort('tenantName')}>
                  Tenant {getSortIndicator('tenantName')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            )}
            {/* 7. Author */}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Auteur
            </TableHead>
            {/* 8. Published Date */}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Button variant="ghost" onClick={() => onSort('publishedAt')}>
                Publiee {getSortIndicator('publishedAt')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {/* 9. Actions */}
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <TableRow key={post.id}>
              {/* Status */}
              <TableCell className="p-2 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  post.status === PostStatus.PUBLISHED ? 'bg-green-100 text-green-800' : 
                  post.status === PostStatus.DRAFT     ? 'bg-yellow-100 text-yellow-800' :
                                                         'bg-gray-100 text-gray-800 text-base'
                }`}>
                  {post.status}
                </span>
              </TableCell>
              {/* Title and Slug */}
              <TableCell className="px-6 py-4">
                <Link href={buildPostLink(post)} className="flex items-center">
                  {post.heroImage?.url && (
                    <div className="flex-shrink-0 h-10 w-10">
                      <Image
                        className='h-10 w-10 object-cover rounded-md border border-gray-200'
                        src={post.heroImage.url}
                        height={60}
                        width={60}
                        alt={`${post.title} Hero`}
                        unoptimized // Use unoptimized for external assets
                      />
                    </div>
                  )}
                  <div className="ml-4 max-w-sm truncate">
                    <div className="text-sm font-medium text-gray-900 truncate">
                        {post.title.slice(0, 50)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{post.slug.slice(0, 50)}</div>
                  </div>
                </Link>
              </TableCell>
              
              {/* Type */}
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {post.type}
              </TableCell>

              {/* Tenant (Conditional) */}
              {(isSystemAdmin || isTenantAdmin) && (
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link href={buildLink(`/tenant/dashboard`)} className="text-primary-600 hover:text-primary-800">
                    {post.tenant.tenantCode}
                  </Link>
                </TableCell>
              )}
              {/* Author */}
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {post.createdBy ? 
                    post.createdBy.username
                 : 'System'}
              </TableCell>
              
              {/* Published Date */}
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : '-'}
              </TableCell>

              {/* Actions */}
              <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={buildPostLink(post)} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" /> View/Edit
                      </Link>
                    </DropdownMenuItem>
                    {/* Allow deletion for higher-level admins or the author (if logic allows) */}
                    {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && (
                      <DropdownMenuItem onClick={() => onDelete(post.id)} className="flex items-center text-red-600 cursor-pointer">
                        <Trash className="mr-2 h-4 w-4" /> Delete Post
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