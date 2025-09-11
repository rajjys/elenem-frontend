"use client";

import React, { useState, useRef, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Card,
} from "@/components/ui";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  SportType,
  Roles,
  TenantTypes,
  UserResponseDto,
  PaginatedResponseDto,
  CreateTenantSchema,
} from "@/schemas";

// Step components
import { Stepper, Step1Details, Step2BusinessProfile, Step3Review } from "./";

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

  // previews + upload states
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [bannerProgress, setBannerProgress] = useState(0);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(CreateTenantSchema),
    defaultValues: {
      name: "",
      tenantCode: "",
      tenantType: TenantTypes.COMMERCIAL,
      sportType: SportType.FOOTBALL,
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

  const { handleSubmit, trigger, setValue } = form;
  const currentUserRoles = userAuth?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);

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

  // upload + confirm helper (kept in main so Step2 can call it)
  async function uploadAndConfirm(file: File, field: "logo" | "banner") {
    const setUploading = field === "logo" ? setUploadingLogo : setUploadingBanner;
    const setProgress = field === "logo" ? setLogoProgress : setBannerProgress;
    const setPreview = field === "logo" ? setLogoPreview : setBannerPreview;
    const setAssetId = (id: string | null) => {
      if (field === "logo") setValue("businessProfile.logoAssetId", id);
      else setValue("businessProfile.bannerAssetId", id);
      trigger(`businessProfile.${field}AssetId`);
    };

    setUploading(true);
    setProgress(0);

    try {
      const presignResp = await api.post("/uploads/presign", {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      const presign = presignResp.data;
      const uploadUrl =
        presign.presignedUrl ??
        presign.url ??
        presign.uploadUrl ??
        presign.signedUrl;
      const assetId = presign.assetId ?? presign.id;
      if (!uploadUrl) throw new Error("No upload URL");

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      const confirmResp = await api.post("/uploads/confirm", { assetId });
      const asset = confirmResp.data;
      setAssetId(asset.id);
      setPreview(asset.url ?? null);
      toast.success("Upload successful");
      return asset;
    } catch (err) {
      toast.error("Upload failed");
      setAssetId(null);
      setPreview(null);
      setProgress(0);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  // submit handler
  const onSubmit: SubmitHandler<TenantFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        businessProfile: { ...data.businessProfile, name: data.name },
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

  const steps = ["Tenant Details", "Business Profile", "Review & Submit"];

  return (
    <div className="flex justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-7xl shadow-lg rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />
            {currentStep === 0 && <Step1Details form={form} />}
            {currentStep === 1 && (
              <Step2BusinessProfile
                form={form}
                logoInputRef={logoInputRef}
                bannerInputRef={bannerInputRef}
                logoPreview={logoPreview}
                setLogoPreview={setLogoPreview}
                bannerPreview={bannerPreview}
                setBannerPreview={setBannerPreview}
                uploadingLogo={uploadingLogo}
                uploadingBanner={uploadingBanner}
                logoProgress={logoProgress}
                bannerProgress={bannerProgress}
                uploadAndConfirm={uploadAndConfirm}
                availableOwners={availableOwners}
                ownersLoading={ownersLoading}
                currentUserRoles={currentUserRoles}
              />
            )}
            {currentStep === 2 && (
              <Step3Review form={form} currentUserRoles={currentUserRoles} />
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
