"use client";

import { RefObject, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import Image from "next/image";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CollapsibleTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
} from "@/components/ui";
import { RegionDropdown } from "react-country-region-selector";
import { Camera, ChevronDown, Trash } from "lucide-react";
import { TenantFormValues } from ".";
import { Roles, UserResponseDto } from "@/schemas";
import { useUploadAndConfirm } from "@/hooks/useUploadAndConfirm";

interface Step2Props {
  form: UseFormReturn<TenantFormValues>;
  logoInputRef: RefObject<HTMLInputElement | null>;
  bannerInputRef: RefObject<HTMLInputElement | null>;
  logoPreview: string | null;
  setLogoPreview: (url: string | null) => void;
  bannerPreview: string | null;
  setBannerPreview: (url: string | null) => void;
  availableOwners: UserResponseDto[];
  ownersLoading: boolean;
  currentUserRoles: string[];
}

export function Step2BusinessProfile({
  form,
  logoInputRef,
  bannerInputRef,
  logoPreview,
  setLogoPreview,
  bannerPreview,
  setBannerPreview,
  availableOwners,
  ownersLoading,
  currentUserRoles,
}: Step2Props) {
  const { register, setValue, watch, formState: { errors }, trigger } = form;
  const country = watch("country");
  const [showMore, setShowMore] = useState(false);

  // Hooks for logo & banner
  const logoUpload = useUploadAndConfirm();
  const bannerUpload = useUploadAndConfirm();

  async function handleUpload(file: File, field: "logo" | "banner") {
    const uploader = field === "logo" ? logoUpload : bannerUpload;
    const setPreview = field === "logo" ? setLogoPreview : setBannerPreview;

    const asset = await uploader.upload(file);
    if (asset) {
      if (field === "logo") {
        setValue("businessProfile.logoAssetId", asset.id);
      } else {
        setValue("businessProfile.bannerAssetId", asset.id);
      }
      setPreview(asset.url ?? null);
      trigger(`businessProfile.${field}AssetId`);
    } else {
      // reset on failure
      if (field === "logo") {
        setValue("businessProfile.logoAssetId", null);
        setLogoPreview(null);
      } else {
        setValue("businessProfile.bannerAssetId", null);
        setBannerPreview(null);
      }
    }
  }

  return (
    <div className="">
      {/* Banner */}
      <div className="relative mb-12">
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {bannerPreview ? (
            <Image src={bannerPreview} alt="Banner preview" width={736} height={480} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400">No banner yet — upload one</div>
          )}
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <button type="button" onClick={() => bannerInputRef.current?.click()} className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer">
              <Camera className="w-5 h-5" />
            </button>
            {bannerPreview && (
              <button
                type="button"
                onClick={() => {
                  setValue("businessProfile.bannerAssetId", null);
                  setBannerPreview(null);
                }}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-50"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
          {bannerUpload.uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-white">Uploading... {bannerUpload.progress}%</div>
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="absolute left-2 -bottom-10">
          <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Logo</div>
            )}
            <div className="absolute bottom-1 right-1 flex space-x-2 z-50">
              <button type="button" onClick={() => logoInputRef.current?.click()} className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer">
                <Camera className="w-5 h-5" />
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setValue("businessProfile.logoAssetId", null);
                    setLogoPreview(null);
                  }}
                  className="bg-white p-2 rounded-full shadow hover:bg-gray-50"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
            {logoUpload.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-full">
                <div className="text-white text-sm">{logoUpload.progress}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleUpload(file, "banner");
          if (bannerInputRef.current) bannerInputRef.current.value = "";
        }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleUpload(file, "logo");
          if (logoInputRef.current) logoInputRef.current.value = "";
        }}
      />

      {/* Other fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label>Region (Optional)</Label>
          <RegionDropdown
            country={country}
            value={watch("businessProfile.region") || ""}
            onChange={(val) => setValue("businessProfile.region", val)}
            className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2 relative col-span-2 md:col-span-1">
          <Label>City (Optional)</Label>
          <Input {...register("businessProfile.city")} />
        </div>

        {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
          <div className="space-y-2 col-span-2">
            <Label>Tenant Owner (Optional)</Label>
            <Select
              onValueChange={(value) => setValue("ownerId", value === "null" ? undefined : value)}
              value={watch("ownerId") || "null"}
              disabled={ownersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an owner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Owner</SelectItem>
                {availableOwners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.username} ({owner.firstName} {owner.lastName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ownerId && <p className="text-red-500 text-xs">{errors.ownerId.message}</p>}
          </div>
        )}
      </div>

      <Collapsible open={showMore} onOpenChange={setShowMore}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full flex items-center justify-between">
            Plus de détails
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 md:col-span-2">
            <Label>Description (Optional)</Label>
            <Input {...register("businessProfile.description")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Street Address (Optional)</Label>
            <Input {...register("businessProfile.physicalAddress")} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
