"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Card,
} from "@/components/ui";
import { CheckCircle, ChevronLeft, ChevronRight, ImageIcon, ListTodo, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  SportType,
  Roles,
  TenantTypes,
  UserResponseDto,
  PaginatedResponseDto,
  CreateTenantSchema,
  VisibilityLevel,
} from "@/schemas";

// Step components
import { Step1TenantDetails, Step3Review } from ".";
import { countryNameToCode } from "@/utils";
import { BusinessProfileForm, Stepper, TFormValues } from "../../shared";

// Define a type for the full form data
export type TenantFormValues = z.infer<typeof CreateTenantSchema>;

interface TenantFormProps {
  onSuccess: (tenantId: string) => void;
  onCancel: () => void;
}

export function TenantCreationForm({ onSuccess, onCancel }: TenantFormProps) {
  const { user: userAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);

  // refs for file upload
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  // previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const steps = useMemo(() => ([
      { name: "Details de Base", icon: ListTodo },
      { name: "Personalisation", icon: ImageIcon },
      { name: "Revue et Soumission", icon: CheckCircle },
    ]), []);

  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const canSelectOwner = !(currentUserRoles.includes(Roles.GENERAL_USER) && !isSystemAdmin );

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(CreateTenantSchema),
    defaultValues: {
      name: "",
      tenantCode: "",
      tenantType: TenantTypes.COMMERCIAL,
      sportType: SportType.FOOTBALL,
      isActive: true,
      visibility: VisibilityLevel.PUBLIC,
      country: "",
      businessProfile: {
        description: "",
        logoAssetId: null,
        bannerAssetId: null,
        physicalAddress: "",
        city: "",
        region: "",
      },
    },
  });
  const { handleSubmit, trigger, watch } = form;

  // fetch owners if admin
  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchOwners = async () => {
      setOwnersLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("roles", Roles.GENERAL_USER);
        const response = await api.get<PaginatedResponseDto<UserResponseDto>>(
          "/users",
          { params }
        );
        setAvailableOwners(response.data.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load owners");
      } finally {
        setOwnersLoading(false);
      }
    };
    fetchOwners();
  }, [isSystemAdmin]);

  // step navigation
  const nextStep = async () => {
    let isValid;
    if (currentStep === 0) {
      isValid = await trigger([
        "name",
        "tenantCode",
        "tenantType",
        "sportType",
        "country",
        "isActive",     // 👈 ADDED for Step 1 validation
        "visibility",   // 👈 ADDED for Step 1 validation
      ]);
    } else if (currentStep === 1) {
      isValid = await trigger([
        "businessProfile.city",
        "businessProfile.region",
        "ownerId",
      ]);
    }
    if (isValid) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // submit handler
  const onSubmit: SubmitHandler<TenantFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        businessProfile: { ...data.businessProfile, name: data.name },
        country: countryNameToCode[data.country]
      };
      const response = await api.post("/tenants/create", payload);
      toast.success(`Tenant ${data.tenantCode} created successfully!`);
      onSuccess(response.data.id);
    } catch (error) {
        toast.error("Tenant creation failed");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };
  return (
    <div className="flex justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-7xl shadow-lg rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />
            {currentStep === 0 && <Step1TenantDetails form={form} />}
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
                canSelectOwner={canSelectOwner}
                country={watch("country")}
              />
            )}
            {currentStep === 2 && (
              <Step3Review 
                form={form} 
                currentUserRoles={currentUserRoles}
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
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Create Tenant</span>
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
