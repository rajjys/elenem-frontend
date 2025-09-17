"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Search, X, Building2 } from "lucide-react";
import { useDebounce } from 'use-debounce';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Skeleton
} from ".";
import { api } from "@/services/api";
import { TenantDetails } from "@/schemas";
import Image from "next/image";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

export default function GeneralSearchDialog() {
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<TenantDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTenants = useCallback(async (currentFilters: { search?: string, sportType?: string, country?: string }) => {
    setIsLoading(true);
    try {
      const params = { ...currentFilters };
      const response = await api.get<{ data: TenantDetails[] }>('/public-tenants', { params });
      setTenants(response.data.data);
    } catch (error) {
      let errorMessage = "Failed to fetch Tenants.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const filters: { search?: string, sportType?: string, country?: string } = {};
    if (debouncedQuery) {
      filters.search = debouncedQuery;
    }
    fetchTenants(filters);
  }, [debouncedQuery, fetchTenants]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className="flex-1 py-2 px-4 rounded-xl text-left bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Rechercher une ligue, Équipe ou Ville...</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-lg md:max-w-xl rounded-2xl p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-lg mx-auto overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Rechercher une ligue</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="relative">
            <Input
              value={query}
              type="search"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ligue, équipe, ville…"
              className="pl-9 py-1 w-full rounded-md bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 h-[20rem] overflow-y-auto flex flex-col justify-start">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-3 p-2 my-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : tenants.length > 0 ? (
            tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={tenant.businessProfile.website || `https://${tenant.tenantCode.toLowerCase()}.elenem.site`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="w-full max-w-full rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all mb-2">
                  <CardContent className="p-4 flex items-center gap-3 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {tenant.businessProfile.logoAsset?.url ? (
                        <Image
                          src={tenant.businessProfile.logoAsset?.url}
                          alt={`${tenant.name} logo`}
                          width={30}
                          height={30}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="font-medium leading-tight truncate">{tenant.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {tenant.businessProfile.website || `https://${tenant.tenantCode.toLowerCase()}.elenem.site`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : debouncedQuery ? (
            <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
              Aucun résultat trouvé pour votre recherche.
            </p>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
              Commencez à taper pour rechercher une ligue.
            </p>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
