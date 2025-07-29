// app/(public)/tenants/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { SportType } from '@/schemas';
import { CountryDropdown } from 'react-country-region-selector';
import { Building, Search, Shield, Users } from 'lucide-react';

// --- Helper Types ---
interface Tenant {
  id: string;
  name: string;
  slug: string;
  tenantCode: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  logoUrl?: string | null;
  sportType: SportType;
  country?: string | null;
  _count: {
    leagues: number;
    teams: number;
  };
}

// --- Skeleton Components ---
function TenantCardSkeleton() {
    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <div className="md:flex">
                <div className="md:w-1/3">
                    <Skeleton className="h-48 w-full md:h-full" />
                </div>
                <div className="md:w-2/3 p-6 flex flex-col">
                    <Skeleton className="h-7 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <div className="mt-auto flex items-center space-x-6">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

// --- Main Components ---
function TenantCard({ tenant }: { tenant: Tenant }) {
    const ROOT_DOMAIN = (process.env.NODE_ENV === 'development' ) ? 'lvh.me:3000' : "website.com";
    const protocol = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';
    const tenantUrl = `${protocol}${tenant.slug}.${ROOT_DOMAIN}`;
    
    return (
        <Link href={tenantUrl} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden transition-shadow hover:shadow-xl duration-300 group mb-2">
                <div className="md:flex">
                    <div className="md:w-1/3 md:flex-shrink-0">
                        <div className="relative h-48 w-full md:h-full">
                            <Image
                                src={tenant.bannerImageUrl || `https://placehold.co/600x400/eee/ccc?text=${tenant.name}`}
                                alt={`${tenant.name} banner`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    </div>
                    <div className="md:w-2/3 p-6 flex flex-col bg-card">
                        <h2 className="text-2xl font-bold tracking-tight text-card-foreground group-hover:text-primary">
                            {tenant.name}
                        </h2>
                        <p className="text-sm font-mono text-muted-foreground mb-3">{tenant.tenantCode}</p>
                        <p className="text-muted-foreground text-sm line-clamp-2 flex-grow">
                            {tenant.description || 'A leading organization in the world of sports.'}
                        </p>
                        <div className="mt-4 pt-4 border-t flex items-center space-x-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>{tenant._count.leagues} Leagues</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span>{tenant._count.teams} Teams</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

function TenantsFilters({ onFilterChange }: { onFilterChange: (filters: {search?: string, sportType?: string, country?: string}) => void }) {
    const [search, setSearch] = useState('');
    const [sportType, setSportType] = useState('');
    const [country, setCountry] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => {
        onFilterChange({
            search: debouncedSearch || undefined,
            sportType: sportType || undefined,
            country: country || undefined,
        });
    }, [debouncedSearch, sportType, country, onFilterChange]);

    return (
        <div className="p-4 bg-card border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
                <Label htmlFor="search">Search Tenant</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="search" placeholder="Name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
            </div>
            <div>
                <Label htmlFor="sportType">Sport</Label>
                <Select value={sportType} onValueChange={setSportType}>
                    <SelectTrigger id="sportType"><SelectValue placeholder="Tout les sports" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null">Tout les sports</SelectItem>
                        {Object.values(SportType).map(type => (
                            <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="country">Pays</Label>
                <CountryDropdown value={country} onChange={setCountry} className="w-full p-2 border rounded-md bg-transparent" />
            </div>
        </div>
    );
}

export default function PublicTenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
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
            .catch(() => toast.error("Failed to load tenants."))
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

                <TenantsFilters onFilterChange={setFilters} />

                <div className="space-y-6">
                    {loading && page === 1 ? (
                        Array.from({ length: 5 }).map((_, i) => <TenantCardSkeleton key={i} />)
                    ) : tenants.length > 0 ? (
                        tenants.map(tenant => <TenantCard key={tenant.id} tenant={tenant} />)
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
