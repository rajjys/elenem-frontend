// app/(public)/tenants/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { api } from '@/services/api';
import { PublicTenantBasic } from '@/schemas';
import { Building } from 'lucide-react';
import PublicTenantCard from '@/components/tenant/public-tenant-card';
import PublicTenantCardSkeleton from '@/components/tenant/public-tenant-card-skeleton';
import PublicTenantsFilters from '@/components/tenant/public-tenants-filters';

export default function PublicTenantsPage() {
    const [tenants, setTenants] = useState<PublicTenantBasic[]>([]);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    
    const fetchTenants = useCallback((currentPage: number, currentFilters: {search?: string, sportType?: string, country?: string}) => {
        setLoading(true);
        const params = { ...currentFilters, page: currentPage, pageSize: 10 };
        api.get('/public-tenants', { params })
            .then(response => {
                const { data, totalPages: newTotalPages } = response.data;
                setTenants(prev => currentPage === 1 ? data : [...prev, ...data]);
                setTotalPages(newTotalPages);
            })
            .catch()
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setPage(1); // Reset page when filters change
        fetchTenants(1, filters);
    }, [filters, fetchTenants]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTenants(nextPage, filters);
    };

    return (
        <div className="bg-gray-50 min-h-screen max-w-3xl mx-auto">
            <div className="container mx-auto p-4 sm:p-6 space-y-8">
                <header className="text-center">
                    <Building className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">Discover Organizations</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Browse the federations and organizations on our platform.</p>
                </header>

                <PublicTenantsFilters onFilterChange={setFilters} />

                <div className="space-y-6">
                    {loading && page === 1 ? (
                        Array.from({ length: 5 }).map((_, i) => <PublicTenantCardSkeleton key={i} />)
                    ) : tenants.length > 0 ? (
                        tenants.map(tenant => <PublicTenantCard key={tenant.id} tenant={tenant} />)
                    ) : (
                        <div className="text-center py-16 bg-card rounded-lg border">
                            <h3 className="text-xl font-semibold">No Organizations Found</h3>
                            <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
                        </div>
                    )}
                </div>

                {loading && page > 1 && <div className="text-center"><p>Loading more...</p></div>}

                {!loading && page < totalPages && (
                    <div className="text-center pt-8">
                        <Button onClick={handleLoadMore} size="lg">
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
