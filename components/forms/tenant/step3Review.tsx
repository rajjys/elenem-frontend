"use client";

import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import {
  CardContent,
  getSportIcon,
} from "@/components/ui";
import { TenantFormValues } from ".";
import { Roles } from "@/schemas";
import CountryFlag from 'react-country-flag';
import { capitalizeFirst, countryNameToCode } from "@/utils";

interface Step3Props {
  form: UseFormReturn<TenantFormValues>;
  currentUserRoles: string[];
  logoPreview: string | null;
  bannerPreview: string | null;
}

export function Step3Review({
  form,
  currentUserRoles,
  logoPreview,
  bannerPreview,
}: Step3Props) {
  const formData = form.watch();

  const Icon = getSportIcon(formData.sportType);
  return (
    <>
      <CardContent className="space-y-6">
        {/* Banner + Logo */}
        <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-12">
          {bannerPreview ? (
            <Image
              src={bannerPreview}
              alt="Banner preview"
              width={736}
              height={480}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">No banner uploaded</div>
          )}

          {/* Logo */}
          <div className="absolute left-4 -bottom-10">
            <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Logo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tenant Details */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-2 border-b border-slate-300">
            <Icon className="w-6 h-6 text-green-800 font-bold" />
            <h3 className="text-lg md:text-xl font-semibold my-2">{formData.name}</h3>
            <span><CountryFlag countryCode={countryNameToCode[formData.country]} svg style={{ width: '2em', height: '1em' }} /></span>
          </div>
          <p className="py-0.5">
            <span className="text-slate-800 pr-1">code:</span>
            <span className="text-slate-800 font-semibold">{formData.tenantCode}</span> 
          </p>
          <p>
            <span className="text-slate-800 pr-1">site:</span>
            <span className="text-slate-800 font-semibold">https://<span className="font-bold">{formData.tenantCode.toLowerCase()}</span>.elenem.site</span> 
          </p>
          <p className="py-0.5">
            <span className="text-slate-800 pr-1">sport:</span>
            <span className="text-slate-800 font-semibold ">{capitalizeFirst(formData.sportType)}</span>
          </p>
          <p className="py-0.5">
            <span className="text-slate-800 pr-1">type:</span>
            <span className="text-slate-800 font-semibold ">{capitalizeFirst(formData.tenantType)}</span>
          </p>
          <p className="py-0.5">
            <span className="text-slate-800 pr-1">pays:</span>
            <span className="text-slate-800 font-semibold ">{capitalizeFirst(formData.country)}</span>
          </p>
          <p className="py-0.5">
            <span className="text-slate-800 pr-1">Visibilite:</span>
            <span className="text-slate-800 font-semibold ">Publique</span>
          </p>
          {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
            <p>
              <strong>Owner:</strong> {formData.ownerId || "N/A"}
            </p>
          )}
        </div>

        {/* Business Profile */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-2 border-b border-slate-300">
            <h3 className="text-lg md:text-xl font-semibold my-2">Profil business</h3>
          </div>
          <p>
            <strong>Description:</strong>{" "}
            {formData.businessProfile.description || "N/A"}
          </p>
          <p>
            <strong>address:</strong>{" "}
            {formData.businessProfile.physicalAddress || "N/A"}
          </p>
          <p>
            <strong>Ville:</strong> {formData.businessProfile.city || "N/A"}
          </p>
          <p>
            <strong>Region:</strong> {formData.businessProfile.region || "N/A"}
          </p>
        </div>
      </CardContent>
    </>
  );
}
