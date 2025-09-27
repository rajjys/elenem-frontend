// LeagueCreationForm.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
} from "@/components/ui";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ListTodo,
  Loader2,
  Notebook,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

import { CreateLeagueSchema } from "@/schemas/league-schemas";
import { UserResponseDto, PaginatedResponseDto, Roles, Gender, VisibilityLevel, TenantDetailsSchema } from "@/schemas";

import { Stepper } from "../shared/stepper";
import Step1BasicInfo from "./step1-basic-info";
import Step3Rules from "./step3-rules";
import Step4Review from "./step4-review";
import { BusinessProfileForm, TFormValues } from "../shared";
import z from "zod";
import axios from "axios";

interface LeagueFormProps {
  onSuccess: (leagueId: string) => void;
  onCancel: () => void;
}

/**
 * Re-usable TS type for the form object used by step components.
 * Use CreateLeagueDto from your schemas to avoid mismatch.
 */
export type LeagueFormValues = z.infer<typeof CreateLeagueSchema>;

export function LeagueForm({ onSuccess, onCancel }: LeagueFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);

  // stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const steps = useMemo(() => ([
      { name: "Details de Base", icon: ListTodo },
      { name: "Personalisation", icon: ImageIcon },
      { name: "Points et Regles", icon: Notebook },
      { name: "Revue et Soumission", icon: CheckCircle },
    ]), []);
  // submission/loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // owners (always available to everyone per your instruction)
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [country, setCountry] = useState<string>();

  // file upload refs & previews (passed down to Step2)
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // react-hook-form
  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(CreateLeagueSchema),
    defaultValues: {
      name: "",
      division: "D1",
      gender: Gender.MALE,
      visibility: VisibilityLevel.PUBLIC,
      tenantId: isSystemAdmin ? "" : userAuth?.tenantId || "",
      isActive: true,
      businessProfile: {
        description: "",
        logoAssetId: null,
        bannerAssetId: null,
        physicalAddress: "",
        city: "",
        region: "",
        country: "",
        name: "",
      },
      pointSystemConfig: {
        rules: [],
      },
      tieBreakerConfig: [],
      ownerId: undefined,
    } as LeagueFormValues,
  });

  const { handleSubmit, trigger, watch } = form;

  // watch tenantId so we can fetch owners for the selected tenant
  const watchedTenantId = watch("tenantId");

  // Fetch owners (open to everyone — optionally filtered by tenantId when provided)
  useEffect(() => {
    const fetchOwners = async () => {
      setOwnersLoading(true);
      try {
        const params = new URLSearchParams();
        // request only standard users (same approach you used elsewhere)
        params.append("roles", Roles.GENERAL_USER);
        if (watchedTenantId) params.append("tenantId", watchedTenantId);
        else if (!isSystemAdmin && userAuth?.tenantId) params.append("tenantId", userAuth.tenantId);

        const resp = await api.get<PaginatedResponseDto<UserResponseDto>>("/users", { params });
        setAvailableOwners(resp.data.data || []);
      } catch (err) {
        console.error("Failed to fetch owners", err);
        toast.error("Failed to load owners");
      } finally {
        setOwnersLoading(false);
      }
    };

    fetchOwners();
    // re-fetch when tenant selection changes or auth changes
  }, [watchedTenantId, userAuth?.tenantId, isSystemAdmin]);

  //Fetch Country
  const fetchTenantDetails = useCallback(async () => {
          setLoading(true);
          try {
            const response = await api.get(`/tenants/${watchedTenantId}`);
            const validatedTenant = TenantDetailsSchema.parse(response.data);
            setCountry(validatedTenant.country);
          } catch (error) {
              let errorMessage = "Failed to fetch tenant details.";
              if (axios.isAxiosError(error)) {
                  errorMessage = error.response?.data?.message || errorMessage;
              }
              toast.error(errorMessage);
          } finally {
            setLoading(false);
          }
        }, [watchedTenantId]);

        useEffect(() => {
                // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
                if (watchedTenantId) {
                    fetchTenantDetails();
                }
            }, [watchedTenantId, fetchTenantDetails]);

            
  // step navigation (same approach as Tenant form)
  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 0) {
      // Basic info only (owner moved to step 2)
      isValid = await trigger([
        "name",
        "tenantId",
        "parentLeagueId",
        "division",
        "gender",
        "visibility",
      ]);
    } else if (currentStep === 1) {
      // BusinessProfile + owner
      isValid = await trigger([
        "businessProfile.city",
        "businessProfile.region",
        "ownerId",
      ]);
    } else if (currentStep === 2) {
      isValid = await trigger(["pointSystemConfig", "tieBreakerConfig"]);
    } else {
      isValid = true;
    }

    if (isValid) setCurrentStep((prev) => prev + 1);
    else toast.error("Please fill out all required fields for this step.");
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // final submit
  const onSubmit: SubmitHandler<LeagueFormValues> = async (data) => {
    setIsSubmitting(true);
    setLoading(true);
    try {
      // Non-admins must be restricted to their tenant
      const payload = isSystemAdmin ? data : { ...data, tenantId: userAuth?.tenantId };
      const response = await api.post("/leagues", payload);
      toast.success("League created successfully!");
      onSuccess(response.data.id);
    } catch (error) {
      console.error("League creation failed", error);
      const msg = "League creation failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-7xl shadow-lg rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />

            {currentStep === 0 && <Step1BasicInfo form={form} />}

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
            {currentStep === 2 && <Step3Rules form={form} />}

            {currentStep === 3 && (
              <Step4Review
                form={form}
                logoPreview={logoPreview}
                bannerPreview={bannerPreview}
              />
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t">
            <Button
              type="button"
              variant="danger"
              onClick={onCancel}
              className="flex items-center space-x-2"
              disabled={isSubmitting || loading}
            >
              <X size={16} />
              <span>Cancel</span>
            </Button>

            <div className="flex items-center space-x-4">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={isSubmitting || loading}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting || loading}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Create League</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
