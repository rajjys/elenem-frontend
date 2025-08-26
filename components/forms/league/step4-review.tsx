"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateLeagueDto } from '@/schemas/league-schemas';

export default function Step4_Review() {
  const { watch } = useFormContext();
  const formData: Partial<CreateLeagueDto> = watch();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Tenant ID:</strong> {formData.tenantId}</p>
          <p><strong>Parent League ID:</strong> {formData.parentLeagueId || 'N/A'}</p>
          <p><strong>Division:</strong> {formData.division}</p>
          <p><strong>Gender:</strong> {formData.gender}</p>
          <p><strong>Visibility:</strong> {formData.visibility}</p>
          <p><strong>Owner ID:</strong> {formData.ownerId || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Business Name:</strong> {formData.name}</p>
          <p><strong>Country:</strong> {}</p>
          <p><strong>Region:</strong> {formData.businessProfile?.region || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Point System & Tiebreakers</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Point Rules:</strong></p>
          <ul className="list-disc list-inside">
            {formData.pointSystemConfig?.rules.map((rule, index) => (
              <li key={index}>{rule.outcome}: {rule.points} points</li>
            ))}
          </ul>
          <p className="mt-4"><strong>Tiebreakers:</strong></p>
          <ul className="list-disc list-inside">
            {formData.tieBreakerConfig?.map((tb, index) => (
              <li key={index}>Order {tb.order}: {tb.description}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}