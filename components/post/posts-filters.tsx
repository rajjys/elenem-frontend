"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Filter as FilterIcon } from "lucide-react";
import { PostFilterParams, PostStatus, PostType, Roles, PostTargetType, TenantDetails } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/services/api";
import { toast } from "sonner";
import { capitalizeFirst } from "@/utils";
// import isEqual from 'lodash.isequal';

interface PostsFiltersProps {
  filters: PostFilterParams;
  onFilterChange: (newFilters: PostFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
  fixedTenantId?: string | null;
}

export function PostsFilters({
  filters,
  onFilterChange,
  onPageSizeChange,
  fixedTenantId,
}: PostsFiltersProps) {
  const user = useAuthStore(state => state.user);
  const isSystemAdmin = user?.roles?.includes(Roles.SYSTEM_ADMIN);

  const [search, setSearch] = useState(filters.search || "");
  const [selectedTenantId, setSelectedTenantId] = useState(fixedTenantId || filters.tenantId || "");
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(filters.targetId || "");
  const [selectedTargetType, setSelectedTargetType] = useState<PostTargetType | undefined>();
  const [selectedPostType, setSelectedPostType] = useState<PostType | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | undefined>();
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));
  const [availableTenants, setAvailableTenants] = useState<TenantDetails[]>([]);

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const postTargetTypeOptions = useMemo(
    () => Object.values(PostTargetType).map(type => ({ value: type, label: capitalizeFirst(type) })),
    []
  );
  const postTypeOptions = useMemo(
    () => Object.values(PostType).map(type => ({ value: type, label: capitalizeFirst(type) })),
    []
  );
  const statusOptions = useMemo(
    () => Object.values(PostStatus).map(status => ({ value: status, label: capitalizeFirst(status) })),
    []
  );

  // Fetch tenants for system admin
  const fetchTenants = useCallback(async () => {
    if (!isSystemAdmin || fixedTenantId) return;
    try {
      const response = await api.get("/tenants?pageSize=100");
      setAvailableTenants(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch tenants.");
      console.error("Fetch tenants error:", err);
    }
  }, [fixedTenantId, isSystemAdmin]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // 🔥 MAIN FIX: Remove `filters` from dependencies & deep-compare before firing
  useEffect(() => {
    // 1. Construct the new filter parameters based on local state.
    const currentLocalFilters: PostFilterParams = {
        search: debouncedSearch || undefined,
        tenantId: fixedTenantId || selectedTenantId || undefined,
        targetId: selectedTargetId || undefined,
        targetType: selectedTargetType,
        type: selectedPostType,
        status: selectedStatus,
        // *** IMPORTANT: Do NOT force page: 1 here. Let the parent handle page changes separately. ***
    };
    
    // 2. Construct the filters from the prop, but only the parts controlled by this component.
    const currentPropFilters: Partial<PostFilterParams> = {
        search: filters.search,
        tenantId: filters.tenantId,
        targetId: filters.targetId,
        targetType: filters.targetType,
        type: filters.type,
        status: filters.status,
    };

    // 3. Compare the newly calculated filters against the *current* active filters from props.
    // We also make sure the comparison accounts for fixedTenantId vs selectedTenantId
    const tenantIdToCompare = fixedTenantId || selectedTenantId || undefined;
    const propTenantId = filters.tenantId;

    const areFiltersEqual = (
      currentPropFilters.search === currentLocalFilters.search &&
      (propTenantId === tenantIdToCompare || (!propTenantId && !tenantIdToCompare)) &&
      currentPropFilters.targetId === currentLocalFilters.targetId &&
      currentPropFilters.targetType === currentLocalFilters.targetType &&
      currentPropFilters.type === currentLocalFilters.type &&
      currentPropFilters.status === currentLocalFilters.status
    );


    // 4. If they are different, call onFilterChange with the new values, AND force page: 1 in the new filters object.
    // The parent's onFilterChange logic already handles 'page: 1', so we pass the local state.
    if (!areFiltersEqual) {
        //console.log("Filters changed. Triggering update.");
        
        // Pass only the parts that have changed, and let the parent merge and reset the page.
        // We use the full local state here to ensure all controlled fields are updated.
        onFilterChange({
            ...currentLocalFilters, // This contains the new search/selections
            // The parent component will receive this and correctly merge it with the existing filters,
            // and importantly, will set page: 1 which is cleaner than doing it here.
        });
    }

// Depend only on the state variables that drive the filters.
// Remove 'filters' and 'onFilterChange' (since it's an external function that triggers the loop).
// We keep fixedTenantId as it changes how we calculate selectedTenantId.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearch, selectedTenantId, selectedTargetId, selectedTargetType, selectedPostType, selectedStatus, fixedTenantId]);
  
  useEffect(() => {
    const newSize = parseInt(debouncedPageSizeInput, 10);
    if (!isNaN(newSize) && newSize >= 1 && newSize <= 100 && newSize !== filters.pageSize) {
      onPageSizeChange(newSize);
    }
  }, [debouncedPageSizeInput, filters.pageSize, onPageSizeChange]);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    setSelectedTenantId(fixedTenantId || "");
    setSelectedTargetId("");
    setSelectedPostType(undefined);
    setSelectedTargetType(undefined);
    setSelectedStatus(undefined);
    setPageSizeInput("10");
    onFilterChange({
      ...filters,
      search: undefined,
      tenantId: fixedTenantId || undefined,
      targetId: undefined,
      targetType: undefined,
      type: undefined,
      status: undefined,
      page: 1,
    })
    onPageSizeChange(10);
  }, [filters, fixedTenantId, onFilterChange, onPageSizeChange]);

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-grow max-w-sm">
        <Label htmlFor="postSearch" className="sr-only">
          Rechercher post
        </Label>
        <Input
          id="postSearch"
          type="search"
          placeholder="Recherchez un post"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="transition hover:scale-105">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px] rounded-lg shadow-xl p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Filtres avancés</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your posts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {isSystemAdmin && !fixedTenantId && (
              <div>
                <Label htmlFor="tenantId">Tenant</Label>
                <Select
                  value={selectedTenantId}
                  onValueChange={value => setSelectedTenantId(value === "clear_selection" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear_selection">Clear Selection</SelectItem>
                    {availableTenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="postStatus">Status</Label>
              <Select
                value={selectedStatus || ""}
                onValueChange={(value: PostStatus) => setSelectedStatus(!value ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Post Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={selectedTargetType || ""}
                onValueChange={(value: PostTargetType) => setSelectedTargetType(!value ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Target Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {postTargetTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="postType">Post Type</Label>
              <Select
                value={selectedPostType || ""}
                onValueChange={(value: PostType) => setSelectedPostType(!value ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {postTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button variant="danger" onClick={handleClearAllFilters}>
              Clear All Filters
            </Button>
            <Button type="button" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
