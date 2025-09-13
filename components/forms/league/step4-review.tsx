"use client";

import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui/card";
import { LeagueFormValues } from ".";

interface Step4Props {
  form: UseFormReturn<LeagueFormValues>;
  logoPreview: string | null;
  bannerPreview: string | null;
}

export default function Step4Review({
  form,
  logoPreview,
  bannerPreview,
}: Step4Props) {
  const formData = form.watch();

  return (
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

      {/* Key League Details */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">League Details</h3>
        <p>
          <strong>Name:</strong> {formData.name}
        </p>
        <p>
          <strong>Tenant:</strong> {formData.tenantId}
        </p>
        <p>
          <strong>Division:</strong> {formData.division}
        </p>
        <p>
          <strong>Gender:</strong> {formData.gender}
        </p>
      </div>

      {/* Point System */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Point System & Tiebreakers</h3>
        <p className="font-medium">Point Rules</p>
        <ul className="list-disc list-inside space-y-1">
          {formData.pointSystemConfig?.rules?.length ? (
            formData.pointSystemConfig.rules.map((rule, index) => (
              <li key={index}>
                {rule.outcome}: <strong>{rule.points} points</strong>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500">No point rules defined</p>
          )}
        </ul>

        <p className="mt-4 font-medium">Tiebreakers</p>
        <ul className="list-disc list-inside space-y-1">
          {formData.tieBreakerConfig?.length ? (
            formData.tieBreakerConfig.map((tb, index) => (
              <li key={index}>
                Order {tb.order}: {tb.description}
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tiebreakers defined</p>
          )}
        </ul>
      </div>

      {/* Everything Else */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
        <p>
          <strong>Visibility:</strong> {formData.visibility}
        </p>
        <p>
          <strong>Owner:</strong> {formData.ownerId || "N/A"}
        </p>
        <p>
          <strong>Parent League:</strong> {formData.parentLeagueId || "N/A"}
        </p>
        <p>
          <strong>Country:</strong> N/A
        </p>
        <p>
          <strong>Region:</strong> {formData.businessProfile?.region || "N/A"}
        </p>
        <p>
          <strong>City:</strong> {formData.businessProfile?.city || "N/A"}
        </p>
      </div>
    </CardContent>
  );
}
