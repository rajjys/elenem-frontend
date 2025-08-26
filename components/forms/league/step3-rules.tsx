"use client";

import React, { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import { api } from '@/services/api';

export default function Step3_Rules() {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext();
  const watchedTenantId = watch('tenantId');
  const [sportType, setSportType] = useState(null);
  
  // Array hooks for point rules and tiebreakers
  const { fields: pointRuleFields, remove: removePointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.rules",
  });
  const { fields: tiebreakerFields, remove: removeTiebreaker, append: appendTiebreaker } = useFieldArray({
    control,
    name: "tieBreakerConfig.tieBreakers",
  });

  // Fetch sportType from tenant and then fetch rules
  useEffect(() => {
    if (watchedTenantId) {
      const fetchTenantAndRules = async () => {
        try {
          // Fetch the tenant to get the sportType
          const tenantRes = await api.get(`/tenants/${watchedTenantId}`);
          const fetchedSportType = tenantRes.data.sportType;
          setSportType(fetchedSportType);
          
          // Fetch the default rules for that sport type
          const rulesRes = await api.get(`/sport-rules/${fetchedSportType}`);
          setValue('pointSystemConfig', rulesRes.data.pointSystem);
          setValue('tieBreakerConfig', { tieBreakers: rulesRes.data.tieBreakers });

        } catch (error) {
          console.error("Failed to fetch sport rules", error);
        }
      };
      fetchTenantAndRules();
    }
  }, [watchedTenantId, setValue]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Point System</h3>
        <span className="text-sm text-gray-500">Sport: {sportType}</span>
      </div>

      <div className="space-y-4">
        {pointRuleFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <Label className="w-1/4">{field.outcome}</Label>
            <Input
              type="number"
              {...register(`pointSystemConfig.rules.${index}.points`, { valueAsNumber: true })}
              className="w-1/4"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-md font-medium">Tiebreakers</h4>
        {tiebreakerFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <Input
              type="number"
              {...register(`tieBreakerConfig.tieBreakers.${index}.order`, { valueAsNumber: true })}
              className="w-16"
            />
            <Input
              readOnly
              value={field.description}
              className="flex-grow bg-gray-100 text-gray-700"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeTiebreaker(index)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}