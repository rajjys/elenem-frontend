// Step3_TeamReview.tsx
"use client";

import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { CardContent } from "@/components/ui";
import { TeamFormValues } from "./team-form";
import { User } from "@/schemas";

interface UserLite { id: string; username: string; }
interface LeagueLite { id: string; name: string; }
interface VenueLite { id: string; name: string; }

interface Props {
  form: UseFormReturn<TeamFormValues>;
  logoPreview: string | null;
  bannerPreview: string | null;
  owners: UserLite[];
  leagues: LeagueLite[];
  venues: VenueLite[];
  userAuth?: User;
}

export default function Step3_TeamReview({ form, logoPreview, bannerPreview, owners, leagues, venues, userAuth }: Props) {
  const formData = form.watch();

  const leagueName = formData.leagueId ? (leagues.find(l => l.id === formData.leagueId)?.name ?? formData.leagueId) : (userAuth?.managingLeague?.name ?? userAuth?.managingLeagueId) || "N/A";
  const ownerName = formData.ownerId ? (owners.find(o => o.id === formData.ownerId)?.username ?? formData.ownerId) : "N/A";
  const venueName = formData.homeVenueId ? (venues.find(v => v.id === formData.homeVenueId)?.name ?? formData.homeVenueId) : "N/A";

  return (
    <CardContent className="space-y-6">
      {/* Banner + Logo */}
      <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-12">
        {bannerPreview || formData.businessProfile?.bannerImageUrl ? (
          <Image
            src={bannerPreview ?? (formData.businessProfile?.bannerImageUrl as string)}
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
            {logoPreview || formData.businessProfile?.logoUrl ? (
              <Image
                src={logoPreview ?? (formData.businessProfile?.logoUrl as string)}
                alt="Logo preview"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Logo</div>
            )}
          </div>
        </div>
      </div>

      {/* Key Team Details */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Team Details</h3>
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>League:</strong> {leagueName}</p>
        <p><strong>Short Code:</strong> {formData.shortCode || "N/A"}</p>
        <p><strong>Visibility:</strong> {formData.visibility}</p>
      </div>

      {/* Business Profile */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Business Profile</h3>
        <p><strong>Description:</strong> {formData.businessProfile?.description || "N/A"}</p>
        <p><strong>Owner:</strong> {ownerName}</p>
        <p><strong>Home Venue:</strong> {venueName}</p>
      </div>

      {/* Raw media info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Media</h3>
        <p><strong>Logo URL:</strong> {formData.businessProfile?.logoUrl || "N/A"}</p>
        <p><strong>Banner URL:</strong> {formData.businessProfile?.bannerImageUrl || "N/A"}</p>
      </div>
    </CardContent>
  );
}
