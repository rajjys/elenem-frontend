"use client";

import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import {
  CardContent,
} from "@/components/ui";
import { TenantFormValues } from ".";
import { Roles } from "@/schemas";

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
          <h3 className="text-lg font-semibold mb-2">Tenant Details</h3>
          <p>
            <strong>Name:</strong> {formData.name}
          </p>
          <p>
            <strong>Code:</strong> {formData.tenantCode}
          </p>
          <p>
            <strong>Type:</strong> {formData.tenantType}
          </p>
          <p>
            <strong>Sport:</strong> {formData.sportType}
          </p>
          <p>
            <strong>Country:</strong> {formData.country}
          </p>
          {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
            <p>
              <strong>Owner:</strong> {formData.ownerId || "N/A"}
            </p>
          )}
        </div>

        {/* Business Profile */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Business Profile</h3>
          <p>
            <strong>Description:</strong>{" "}
            {formData.businessProfile.description || "N/A"}
          </p>
          <p>
            <strong>Street Address:</strong>{" "}
            {formData.businessProfile.physicalAddress || "N/A"}
          </p>
          <p>
            <strong>City:</strong> {formData.businessProfile.city || "N/A"}
          </p>
          <p>
            <strong>Region:</strong> {formData.businessProfile.region || "N/A"}
          </p>
        </div>
      </CardContent>
    </>
  );
}
