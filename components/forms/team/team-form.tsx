// TeamForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Card,
  LoadingSpinner,
} from "@/components/ui";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Roles,
  TeamVisibility,
  CreateTeamFormSchema as CreateTeamSchema,
  TeamFilterParams,
  TeamDetails,
  TenantDetailsSchema,
} from "@/schemas";
import { CheckCircle, ChevronLeft, ChevronRight, ListTodo, Image as ImageIcon, Loader2, X } from "lucide-react";
import axios from "axios";

import Step1TeamDetails from "./Step1TeamDetails";
import Step3_TeamReview from "./Step3TeamReview";
import { BusinessProfileForm, Stepper, TFormValues } from "../shared";

type TeamFormValues = z.infer<typeof CreateTeamSchema>;
export type { TeamFormValues };

interface TeamFormProps {
  onSuccess: (team: TeamDetails) => void;
  onCancel: () => void;
}

interface TenantLite { id: string; name: string; }
interface LeagueLite { id: string; name: string; tenantId: string; }
interface VenueLite { id: string; name: string;}
interface UserLite { id: string; username: string; email?: string; }

export function TeamForm({ onSuccess, onCancel }: TeamFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles ?? [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tenants, setTenants] = useState<TenantLite[]>([]);
  const [leagues, setLeagues] = useState<LeagueLite[]>([]);
  const [venues, setVenues] = useState<VenueLite[]>([]); // placeholder moved to Step1
  const [availableOwners, setAvailableOwners] = useState<UserLite[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [country, setCountry] = useState<string>();

  // file refs + previews for business profile (passed to Step2)
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const steps = useMemo(() => ([
    { name: "Details de Base", icon: ListTodo },
    { name: "Personalisation", icon: ImageIcon },
    { name: "Revue et Soumission", icon: CheckCircle },
  ]), []);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      shortCode: "",
      visibility: TeamVisibility.PUBLIC,
      businessProfile: {
        description: "",
        logoAssetId: null,
        bannerAssetId: null,
        physicalAddress: "",
        city: "",
        region: "",
        website: "",
      },
      ownerId: "",
      homeVenueId: "",
      leagueId: isLeagueAdmin ? (userAuth?.managingLeagueId ?? "") : "",
      tenantId: ( isTenantAdmin || isLeagueAdmin ) ? (userAuth?.tenantId ?? "") : "",
    },
  });

  const { watch, handleSubmit, trigger } = form;
  const selectedTenantId = watch("tenantId");
  //const selectedLeagueId = watch("leagueId");

  // --- data fetching
  useEffect(() => {
    // tenants (SYS ADMIN only)
    if (!isSystemAdmin) return;
    (async () => {
      try {
        const res = await api.get<{ data: TenantLite[] }>("/tenants", { params: { pageSize: 100 } });
        setTenants(res.data.data);
      } catch (error) {
        let errorMessage = "Failed to load tenants";
        if (axios.isAxiosError(error)) errorMessage = error.response?.data?.message || errorMessage;
        toast.error(errorMessage);
      }
    })();
  }, [isSystemAdmin]);

  useEffect(() => {
    // leagues (SYS ADMIN filters by selectedTenantId, TENANT_ADMIN uses user's tenant)
    const fetchLeagues = async () => {
      try {
        if (isLeagueAdmin) return; // pre-bound
        const params: TeamFilterParams = { pageSize: 100 };
        if (isSystemAdmin && selectedTenantId) params.tenantId = selectedTenantId;
        if (isTenantAdmin) params.tenantId = userAuth?.tenantId;
        const res = await api.get<{ data: LeagueLite[] }>("/leagues", { params });
        setLeagues(res.data.data);
      } catch (error) {
        let errorMessage = "Failed to load leagues";
        if (axios.isAxiosError(error)) errorMessage = error.response?.data?.message || errorMessage;
        toast.error(errorMessage);
      }
    };
    fetchLeagues();
  }, [isSystemAdmin, isTenantAdmin, isLeagueAdmin, selectedTenantId, userAuth?.tenantId]);

  useEffect(() => {
    // owners: GENERAL_USERs within tenant scope (same logic)
    const fetchOwners = async () => {
      setOwnersLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("roles", Roles.GENERAL_USER);
        if (isSystemAdmin && selectedTenantId) params.append("tenantId", selectedTenantId);
        if (!isSystemAdmin && userAuth?.tenantId) params.append("tenantId", userAuth.tenantId);
        const res = await api.get<{ data: UserLite[] }>("/users", { params });
        setAvailableOwners(res.data.data);
      } catch (error) {
          let errorMessage = "Failed to load users";
          if (axios.isAxiosError(error)) errorMessage = error.response?.data?.message || errorMessage;
          toast.error(errorMessage);
      }finally {
        setOwnersLoading(false);
      }
    };
    fetchOwners();
  }, [isSystemAdmin, selectedTenantId, userAuth?.tenantId]);

  useEffect(() => {
    // venues placeholder: keep empty list for now (we moved the placeholder UI to Step1)
    setVenues([]); // placeholder; later replace with real API call
  }, []);

  //Fetch Tenant Details
    const fetchTenantDetails = useCallback(async () => {
            try {
              const response = await api.get(`/tenants/${selectedTenantId}`);
              const validatedTenant = TenantDetailsSchema.parse(response.data);
              setCountry(validatedTenant.country);
            } catch (error) {
                let errorMessage = "Failed to fetch tenant details.";
                if (axios.isAxiosError(error)) {
                    errorMessage = error.response?.data?.message || errorMessage;
                }
                toast.error(errorMessage);
            } 
          }, [selectedTenantId]);
  
          useEffect(() => {
                  // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
                  if (selectedTenantId) {
                      fetchTenantDetails();
                  }
              }, [selectedTenantId, fetchTenantDetails]);

  // --- navigation logic (same validation strategy, with homeVenue moved to step 1)
  const nextStep = async () => {
    let isValid;
    if (currentStep === 0) {
      // validate basic + homeVenue (moved here)
      isValid = await trigger(["name", "shortCode", "leagueId", "homeVenueId"]);
    } else if (currentStep === 1) {
      // validate businessProfile + owner
      isValid = await trigger([
        "businessProfile.city",
        "businessProfile.region",
        "ownerId"
      ]);
    } else {
      isValid = true;
    }
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    else toast.error("Please fill out all required fields for this step.");
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // submit
  const onSubmit: SubmitHandler<TeamFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // payload same as original; enforce league scope for league admins
      const payload = {
        name: data.name,
        shortCode: data.shortCode || undefined,
        leagueId: isLeagueAdmin ? (userAuth?.managingLeagueId as string) : data.leagueId,
        visibility: data.visibility,
        homeVenueId: data.homeVenueId || undefined,
        ownerId: data.ownerId || undefined,
        businessProfile: {
          ...data.businessProfile,
          name: data.name, // keep in sync
        },
      };
      const res = await api.post<TeamDetails>("/teams", payload);
      onSuccess(res.data);
    } catch (error) {
        let errorMessage = "Team creation failed. Please try again.";
        if (axios.isAxiosError(error)) errorMessage = error.response?.data?.message || errorMessage;
        toast.error(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!userAuth) return 
                  <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner message="Chargement de l'utilisatuer"/>
                  </div>
  return (
    <div className="flex justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-7xl shadow-lg rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />
            {currentStep === 0 && (
              <Step1TeamDetails
                form={form}
                tenants={tenants}
                leagues={leagues}
                venues={venues}
                isSystemAdmin={isSystemAdmin}
                isTenantAdmin={isTenantAdmin}
                isLeagueAdmin={isLeagueAdmin}
              />
            )}

            {currentStep === 1 && (
              <BusinessProfileForm
                form={form as unknown as UseFormReturn<TFormValues>}
                logoInputRef={logoInputRef}
                bannerInputRef={bannerInputRef}
                logoPreview={logoPreview}
                setLogoPreview={setLogoPreview}
                bannerPreview={bannerPreview}
                setBannerPreview={setBannerPreview}
                availableOwners={availableOwners}
                ownersLoading={ownersLoading}
                country={country}
              />
            )}

            {currentStep === 2 && (
              <Step3_TeamReview form={form} logoPreview={logoPreview} bannerPreview={bannerPreview} owners={availableOwners} leagues={leagues} venues={venues} userAuth={userAuth} />
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t">
            <Button type="button" variant="danger" onClick={onCancel} className="flex items-center space-x-2" disabled={isSubmitting}>
              <X size={16} /> <span>Cancel</span>
            </Button>

            <div className="flex items-center space-x-4">
              {currentStep > 0 && (
                <Button type="button" variant="ghost" onClick={prevStep} disabled={isSubmitting}>
                  <ChevronLeft size={16} /> <span>Back</span>
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                  <span>Next</span> <ChevronRight size={16} />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2">
                  {isSubmitting ? (<><Loader2 className="animate-spin" size={16} /> <span>Submitting...</span></>) : (<span>Create Team</span>)}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default TeamForm;
