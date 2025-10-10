// Step2BusinessProfile.tsx
"use client";

import React, { RefObject, useState } from "react";
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
import { useUploadAndConfirm } from "@/hooks/useUploadAndConfirm";
import { CreateBusinessProfileSchema } from "@/schemas/common-schemas";
import z from "zod";

type OwnerLite = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Minimal shape required by this step.
 * Extend this type if you add extra fields that the step must touch.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WithBusinessProfileSchema = z.object({
    businessProfile: CreateBusinessProfileSchema,
    ownerId: z.string().optional().nullable()
})
export type TFormValues = z.infer<typeof WithBusinessProfileSchema>;

interface Step2BusinessProfileProps {
  form: UseFormReturn<TFormValues>;
  logoInputRef: RefObject<HTMLInputElement | null>;
  bannerInputRef: RefObject<HTMLInputElement | null>;
  logoPreview: string | null;
  setLogoPreview: (url: string | null) => void;
  bannerPreview: string | null;
  setBannerPreview: (url: string | null) => void;
  availableOwners: OwnerLite[];
  ownersLoading?: boolean;
  country?: string; // required for RegionDropdown
  canSelectOwner?: boolean; // computed by parent
}

export function BusinessProfileForm({
  form,
  logoInputRef,
  bannerInputRef,
  logoPreview,
  setLogoPreview,
  bannerPreview,
  setBannerPreview,
  availableOwners,
  ownersLoading = false,
  country = "",
  canSelectOwner = true,
}: Step2BusinessProfileProps) {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const [showMore, setShowMore] = useState(false);

  const logoUpload = useUploadAndConfirm();
  const bannerUpload = useUploadAndConfirm();

  async function handleUpload(file: File, field: "logo" | "banner") {
    const uploader = field === "logo" ? logoUpload : bannerUpload;
    const setPreview = field === "logo" ? setLogoPreview : setBannerPreview;

    const asset = await uploader.upload(file);
    if (asset) {
      const fieldName = (field === "logo" ? "businessProfile.logoAssetId" : "businessProfile.bannerAssetId");
      setValue(fieldName, asset.id ?? null);
      setPreview(asset.url ?? null);
      await trigger(fieldName);
    } else {
      const fieldName = (field === "logo" ? "businessProfile.logoAssetId" : "businessProfile.bannerAssetId");
      setValue(fieldName, null);
      setPreview(null);
    }
  }

  // helpful typed watches
  const regionValue = watch("businessProfile.region") as string | undefined;
  const ownerValue = (watch("ownerId") ?? "null") as string;

  return (
    <div>
      {/* Banner */}
      <div className="relative mb-12">
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {bannerPreview ? (
            <Image src={bannerPreview} alt="Aperçu de la bannière" width={736} height={480} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400">Aucune bannière — téléchargez-en une</div>
          )}

          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer"
              aria-label="Télécharger bannière"
            >
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
                aria-label="Supprimer bannière"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>

          {bannerUpload.uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-white">Téléchargement… {bannerUpload.progress}%</div>
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="absolute left-2 -bottom-10">
          <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
            {logoPreview ? (
              <Image src={logoPreview} alt="Aperçu du logo" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Logo</div>
            )}

            <div className="absolute bottom-1 right-1 flex space-x-2 z-50">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer"
                aria-label="Télécharger logo"
              >
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
                  aria-label="Supprimer logo"
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

      {/* Hidden file inputs */}
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

      {/* Exposed fields: Region, City, EstablishedYear */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label>Région (facultatif)</Label>
          <RegionDropdown
            country={country || ""}
            value={regionValue ?? ""}
            onChange={(value) => setValue("businessProfile.region", value)}
            className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label>Ville (facultatif)</Label>
          <Input {...register("businessProfile.city")} />
        </div>

        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label>Année de création (facultatif)</Label>
          <Input
            type="number"
            {...register("businessProfile.establishedYear")}
            placeholder="e.g. 2019"
          />
        </div>

        {canSelectOwner && (
          <div className="space-y-2 col-span-2">
            <Label>Propriétaire (facultatif)</Label>
            <Select
              onValueChange={(value) => setValue("ownerId", value === "null" ? undefined : value)}
              value={ownerValue}
              disabled={ownersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un propriétaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null" disabled>Aucun</SelectItem>
                {availableOwners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.username} {o.firstName || o.lastName ? `(${o.firstName ?? ""} ${o.lastName ?? ""})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ownerId && <p className="text-xs text-red-500">{String(errors.ownerId?.message ?? "")}</p>}
          </div>
        )}
      </div>

      {/* Collapsible: everything else */}
      <Collapsible open={showMore} onOpenChange={setShowMore}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full flex items-center justify-between mt-4">
            Plus de détails
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 md:col-span-2 mt-4">
            <Label>Adresse</Label>
            <Input {...register("businessProfile.physicalAddress")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Input {...register("businessProfile.description")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Site Web</Label>
            <Input {...register("businessProfile.website")} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default BusinessProfileForm;
