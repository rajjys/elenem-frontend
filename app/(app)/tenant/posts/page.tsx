"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { LoadingSpinner, Pagination } from "@/components/ui";
import { PostFilterParams, PostFilterParamsSchema, PostResponseDto, Roles } from "@/schemas";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useContextualLink } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PostsFilters, PostsTable } from "@/components/post";

type SortableColumn = 'title' | 'type' | 'status' | 'tenantName' | 'leagueName' | 'teamName' | 'createdAt' | 'publishedAt';

export default function TenantPostsPage() {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = useMemo(() => userAuth?.roles || [], [userAuth?.roles]);
  const ctxTenantId = useSearchParams().get("ctxTenantId");

  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const currentTenantId = isSystemAdmin
    ? ctxTenantId
    : isTenantAdmin
    ? userAuth?.tenantId
    : null;

  const { buildLink } = useContextualLink();
  const [posts, setPosts] = useState<PostResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<PostFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    tenantId: currentTenantId,
  });

  // Update filters when currentTenantId changes
  useEffect(() => {
    if (currentTenantId && filters.tenantId !== currentTenantId) {
      setFilters(prev => ({ ...prev, tenantId: currentTenantId, page: 1 }));
    }
  }, [currentTenantId, filters.tenantId]);

  const fetchPosts = useCallback(async () => {
    if (!currentTenantId) {
      setLoading(false);
      setError("Tenant ID not available. Please log in as a Tenant Admin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validatedFilters = PostFilterParamsSchema.parse(filters);
      const params = new URLSearchParams();

      Object.entries(validatedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, String(item)));
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      const response = await api.get(`/posts?${params.toString()}`);
      const validatedData = response.data;
      
      setPosts(validatedData.data || []);
      setTotalItems(validatedData.totalItems || 0);
      setTotalPages(validatedData.totalPages || 1);
    } catch (error) {
      const errorMessage = "Failed to fetch posts.";
      setError(errorMessage);
      toast.error("Error fetching posts", { description: errorMessage });
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentTenantId]);

  // Fetch posts whenever filters or tenant changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFilterChange = useCallback(
    (newFilters: PostFilterParams) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        tenantId: currentTenantId, // always fixed
        page: 1,
      }));
    },
    [currentTenantId]
  );

  const handlePageChange = useCallback(
    (newPage: number) => setFilters(prev => ({ ...prev, page: newPage })),
    []
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 })),
    []
  );

  const handleSort = useCallback((column: SortableColumn) => {
      setFilters(prev => ({
        ...prev,
        sortBy: column,
        sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 1,
      }));
    }, []);

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      );
      if (!confirmed) return;

      try {
        await api.delete(`/posts/${postId}`);
        toast.success("Post deleted successfully.");
        fetchPosts();
      } catch (error) {
        const errorMessage = "Failed to delete post.";
        toast.error("Error deleting post", { description: errorMessage });
        console.error("Delete post error:", error);
      }
    },
    [fetchPosts]
  );

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <PostsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageSizeChange={handlePageSizeChange}
          fixedTenantId={currentTenantId}
        />
        <Link
          href={buildLink("/post/create")}
          className="flex items-center text-sm gap-2 px-3 py-2 rounded-md transition-all duration-150 soft-theme-gradient"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline whitespace-nowrap">Nouvelle Publication</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Aucune Publication trouvée</p>
      ) : (
        <div>
          <p className="py-2 text-base md:text-lg font-semibold text-slate-500">
            {totalItems} Publications
          </p>
          <PostsTable
            posts={posts}
            onSort={handleSort}
            sortBy={filters.sortBy || 'createdAt'}
            sortOrder={filters.sortOrder || 'desc'}
            onDelete={handleDeletePost}
            currentUserRoles={currentUserRoles}
            currentTenantId={currentTenantId}
          />
        </div>
      )}

      <Pagination
        currentPage={filters.page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
