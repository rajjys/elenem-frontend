// app/(public)/tenants/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { api } from '@/services/api';
import { PublicTenantBasic } from '@/schemas';
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
        console.log(params);
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
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 min-h-screen">
            <div className="container max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
                <header>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Toutes les Organisations Sportives
                </h1>
                <p className="mt-2 text-sm md:text-md">
                    Parcourez les fédérations et les organisations sur notre plateforme.
                </p>
                </header>

                <PublicTenantsFilters onFilterChange={setFilters} />

                <div className="space-y-6">
                {loading && page === 1 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                    <PublicTenantCardSkeleton key={i} />
                    ))
                ) : tenants.length > 0 ? (
                    tenants.map((tenant) => <PublicTenantCard key={tenant.id} tenant={tenant} />)
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Aucune Organisation Trouvée
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Essayez de modifier vos filtres.
                    </p>
                    </div>
                )}
                </div>

                {loading && page > 1 && (
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
                </div>
                )}

                {!loading && page < totalPages && (
                <div className="text-center pt-8">
                    <Button onClick={handleLoadMore} size="lg">
                    Plus
                    </Button>
                </div>
                )}
            </div>
        </div>
    );
}
