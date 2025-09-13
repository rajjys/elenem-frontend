// Step2_TeamBusinessProfile.tsx
"use client";

import React, { RefObject } from "react";
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
import { Camera, ChevronDown, Trash } from "lucide-react";
import { TeamFormValues } from "./team-form";
import { useUploadAndConfirm } from "@/hooks/useUploadAndConfirm";

interface UserLite { id: string; username: string; email?: string; firstName?: string; lastName?: string; }

interface Props {
  form: UseFormReturn<TeamFormValues>;
  logoInputRef: RefObject<HTMLInputElement | null>;
  bannerInputRef: RefObject<HTMLInputElement | null>;
  logoPreview: string | null;
  setLogoPreview: (url: string | null) => void;
  bannerPreview: string | null;
  setBannerPreview: (url: string | null) => void;
  availableOwners: UserLite[];
  ownersLoading: boolean;
}

export default function Step2_TeamBusinessProfile({
  form,
  logoInputRef,
  bannerInputRef,
  logoPreview,
  setLogoPreview,
  bannerPreview,
  setBannerPreview,
  availableOwners,
  ownersLoading,
}: Props) {
  const { register, setValue, watch, formState: { errors }, trigger } = form;
  //const country = watch("businessProfile.country");
  //const [showMore, setShowMore] = useState(false);

  // use same hook as tenant: upload & confirm
  const logoUpload = useUploadAndConfirm();
  const bannerUpload = useUploadAndConfirm();

  async function handleUpload(file: File, field: "logo" | "banner") {
    const uploader = field === "logo" ? logoUpload : bannerUpload;
    const setPreview = field === "logo" ? setLogoPreview : setBannerPreview;

    // assume uploader.upload(file) returns asset { id?, url? }
    const asset = await uploader.upload(file);
    if (asset) {
      // team schema expects URLs — keep the same structure as your original team form (logoUrl / bannerImageUrl)
      if (field === "logo") {
        setValue("businessProfile.logoUrl", asset.url);
      } else {
        setValue("businessProfile.bannerImageUrl", asset.url);
      }
      setPreview(asset.url ?? null);
      await trigger(`businessProfile.${field === "logo" ? "logoUrl" : "bannerImageUrl"}`);
    } else {
      if (field === "logo") {
        setValue("businessProfile.logoUrl", "");
        setLogoPreview(null);
      } else {
        setValue("businessProfile.bannerImageUrl", "");
        setBannerPreview(null);
      }
    }
  }

  return (
    <div>
      {/* Banner area */}
      <div className="relative mb-12">
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {bannerPreview || watch("businessProfile.bannerImageUrl") ? (
            <Image
              src={bannerPreview ?? (watch("businessProfile.bannerImageUrl") as string)}
              alt="Banner preview"
              width={736}
              height={480}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">No banner yet — upload one</div>
          )}

          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <button type="button" onClick={() => bannerInputRef.current?.click()} className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer">
              <Camera className="w-5 h-5" />
            </button>

            {(bannerPreview || watch("businessProfile.bannerImageUrl")) && (
              <button
                type="button"
                onClick={() => {
                  setValue("businessProfile.bannerImageUrl", "");
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
        <div className="absolute left-4 -bottom-10">
          <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
            {logoPreview || watch("businessProfile.logoUrl") ? (
              <Image src={logoPreview ?? (watch("businessProfile.logoUrl") as string)} alt="Logo preview" width={112} height={112} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Logo</div>
            )}

            <div className="absolute bottom-1 right-1 flex space-x-2 z-50">
              <button type="button" onClick={() => logoInputRef.current?.click()} className="bg-white p-2 rounded-full shadow hover:bg-gray-50 cursor-pointer">
                <Camera className="w-5 h-5" />
              </button>
              {(logoPreview || watch("businessProfile.logoUrl")) && (
                <button type="button" onClick={() => { setValue("businessProfile.logoUrl", ""); setLogoPreview(null); }} className="bg-white p-2 rounded-full shadow hover:bg-gray-50">
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

      {/* hidden inputs */}
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

      {/* fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Input {...register("businessProfile.description")} placeholder="Short description…" />
          {errors.businessProfile?.description && <p className="text-xs text-red-500">{errors.businessProfile.description.message as string}</p>}
        </div>

        {/* Owner selection (keeps same role logic in parent) */}
        <div className="space-y-2">
          <Label>Owner (optional)</Label>
          <Select 
            value={watch("ownerId") ?? ""} 
            onValueChange={(value) => setValue("ownerId", value === "null" ? "" : value)}
            disabled={ownersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No owner</SelectItem>
              {availableOwners.map(o => <SelectItem key={o.id} value={o.id}>{o.username}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Street Address (Optional)</Label>
          <Input {...register("businessProfile.physicalAddress")} />
        </div>

        <div className="space-y-2">
          <Label>City (Optional)</Label>
          <Input {...register("businessProfile.city")} />
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full flex items-center justify-between mt-4">
            Plus de détails
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-2">
            <Label>Description (optional)</Label>
            <Input {...register("businessProfile.description")} placeholder="Optional meta field" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
