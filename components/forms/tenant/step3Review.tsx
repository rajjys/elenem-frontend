"use client";

import { UseFormReturn } from "react-hook-form";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { TenantFormValues } from ".";
import { Roles } from "@/schemas";

interface Step3Props {
  form: UseFormReturn<TenantFormValues>;
  currentUserRoles: string[];
}

export function Step3Review({ form, currentUserRoles }: Step3Props) {
  const formData = form.watch();

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Please review all the information before submitting.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tenant Details</h3>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Code:</strong> {formData.tenantCode}</p>
            <p><strong>Type:</strong> {formData.tenantType}</p>
            <p><strong>Sport:</strong> {formData.sportType}</p>
            <p><strong>Country:</strong> {formData.country}</p>
            {currentUserRoles.includes(Roles.SYSTEM_ADMIN) && (
              <p><strong>Owner:</strong> {formData.ownerId || "N/A"}</p>
            )}
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Business Profile</h3>
            <p><strong>Description:</strong> {formData.businessProfile.description || "N/A"}</p>
            <p><strong>Street Address:</strong> {formData.businessProfile.physicalAddress || "N/A"}</p>
            <p><strong>City:</strong> {formData.businessProfile.city || "N/A"}</p>
            <p><strong>Region:</strong> {formData.businessProfile.region || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </>
  );
}
