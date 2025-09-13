"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useFieldArray, useWatch, UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XIcon, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { CreateLeagueDto, PointSystemConfig, TieBreakerConfig } from '@/schemas/league-schemas';
import { toast } from 'sonner';
import { SportType, TenantDetails } from '@/schemas';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LeagueFormValues } from '.';

// Define the API response type for sport rules to ensure type safety
interface SportRulesApiResponse {
  sportType: SportType;
  pointSystem: PointSystemConfig;
  tieBreakers: TieBreakerConfig;
}
interface Step3Props {
   form: UseFormReturn<LeagueFormValues>;
}

export default function Step3Rules({ form } : Step3Props ) {
  const { control, register, setValue, getValues, formState: { errors } } = form;
  const watchedTenantId = useWatch({ control, name: 'tenantId' });
  const [sportRulesTemplate, setSportRulesTemplate] = useState<SportRulesApiResponse | null>(null);
  const [nextPointRule, setNextPointRule] = useState<string>('');
  const [nextTiebreaker, setNextTiebreaker] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // UseFieldArray hooks for point rules and tiebreakers
  const { fields: pointRuleFields, remove: removePointRule, append: appendPointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.rules",
  });
  const { fields: tiebreakerFields, remove: removeTiebreaker, append: appendTiebreaker, move: moveTiebreaker } = useFieldArray({
    control,
    name: "tieBreakerConfig",
  });

  // Fetch sportType and rules only when the tenantId changes
  useEffect(() => {
    if (watchedTenantId) {
      setLoading(true);
      const fetchRules = async () => {
        try {
          const tenantRes = await api.get<TenantDetails>(`/tenants/${watchedTenantId}`);
          const fetchedSportType = tenantRes.data.sportType;
          
          const rulesRes = await api.get(`/sport-rules/${fetchedSportType}`);
          const fetchedRules: SportRulesApiResponse = rulesRes.data;
          setSportRulesTemplate(fetchedRules);
          
          const currentPointRules = getValues('pointSystemConfig.rules');
          const currentTieBreakers = getValues('tieBreakerConfig');

          // Only initialize with default values if the form is empty
          if (!currentPointRules || currentPointRules.length === 0) {
            setValue('pointSystemConfig', { rules: [] });
            if (fetchedRules.pointSystem?.rules?.length > 0) {
              fetchedRules.pointSystem.rules.forEach(rule => appendPointRule(rule));
            }
          }
          if (!currentTieBreakers || currentTieBreakers.length === 0) {
            setValue('tieBreakerConfig', []);
            if (fetchedRules.tieBreakers?.length > 0) {
              fetchedRules.tieBreakers.forEach(rule => appendTiebreaker(rule));
            }
          }
          
        } catch (error) {
          console.error("Failed to fetch tenant or sport rules", error);
          toast.error("Failed to load sport rules. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      fetchRules();
    }
  }, [watchedTenantId, setValue, appendPointRule, appendTiebreaker, getValues]);

  // Use useWatch to safely get the current values of the fields
  const watchedPointRules = useWatch({ control, name: 'pointSystemConfig.rules' });
  const watchedTieBreakers = useWatch({ control, name: 'tieBreakerConfig' });
  
  // Memoized lists of available rules to add
  const availablePointRules = useMemo(() => {
    if (!sportRulesTemplate) return [];
    const usedPointRules = new Set(watchedPointRules?.map(rule => rule.outcome));
    return sportRulesTemplate.pointSystem.rules.filter(rule => !usedPointRules.has(rule.outcome));
  }, [sportRulesTemplate, watchedPointRules]);

  const availableTiebreakers = useMemo(() => {
    if (!sportRulesTemplate) return [];
    const usedTiebreakerRules = new Set(watchedTieBreakers?.map(rule => rule.rule));
    return sportRulesTemplate.tieBreakers.filter(tb => !usedTiebreakerRules.has(tb.rule));
  }, [sportRulesTemplate, watchedTieBreakers]);

  const handleAddPointRule = () => {
    if (!nextPointRule) {
      toast.error('Please select a point rule to add.');
      return;
    }
    const ruleTemplate = sportRulesTemplate?.pointSystem.rules.find(rule => rule.outcome === nextPointRule);
    if (ruleTemplate) {
      appendPointRule(ruleTemplate);
      setNextPointRule('');
    }
  };

  const handleAddTiebreakerRule = () => {
    if (!nextTiebreaker) {
      toast.error('Please select a tiebreaker rule to add.');
      return;
    }
    const tiebreakerTemplate = sportRulesTemplate?.tieBreakers.find(tb => tb.rule === nextTiebreaker);
    if (tiebreakerTemplate) {
      appendTiebreaker({
        order: (tiebreakerFields?.length || 0) + 1,
        rule: tiebreakerTemplate.rule,
        description: tiebreakerTemplate.description,
        sort: tiebreakerTemplate.sort,
      });
      setNextTiebreaker('');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    // `move` function from `useFieldArray` handles the reordering for us
    moveTiebreaker(result.source.index, result.destination.index);

    // After moving, update the order numbers to reflect the new sequence
    const updatedTiebreakers = getValues('tieBreakerConfig')?.map((tb, index) => ({
      ...tb,
      order: index + 1,
    }));
    setValue('tieBreakerConfig', updatedTiebreakers);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500">Loading sport rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Point System</h3>
        <span className="text-sm text-gray-500">Sport: {sportRulesTemplate?.sportType || 'N/A'}</span>
      </div>

      <div className="space-y-4">
        {pointRuleFields.length === 0 && <p className="text-sm text-gray-500">No point rules found. Select one to add below.</p>}
        {pointRuleFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <Label className="w-1/4">{field.outcome}</Label>
            <Input
              type="number"
              {...register(`pointSystemConfig.rules.${index}.points`, { valueAsNumber: true })}
              className="w-1/4"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePointRule(index)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      {availablePointRules.length > 0 && (
          <div className="flex items-end gap-2 mt-4 pt-4 border-t">
              <div className="flex-grow">
                  <Label>Add New Point Rule</Label>
                  <Select value={nextPointRule} onValueChange={setNextPointRule}>
                      <SelectTrigger><SelectValue placeholder="Select a point rule..." /></SelectTrigger>
                      <SelectContent>
                          {availablePointRules.map(rule => <SelectItem key={rule.outcome} value={rule.outcome}>{rule.outcome.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <Button type="button" variant="secondary" onClick={handleAddPointRule}>Add Rule</Button>
          </div>
      )}

      <div className="space-y-2">
        <h4 className="text-md font-medium">Tiebreakers</h4>
        {tiebreakerFields.length === 0 && <p className="text-sm text-gray-500">No tiebreakers selected. You can add one below.</p>}
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tiebreakers">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {tiebreakerFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border"
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                          <GripVertical />
                        </div>
                        <Input
                          type="number"
                          readOnly
                          {...register(`tieBreakerConfig.${index}.order`, { valueAsNumber: true })}
                          className="w-16 bg-gray-100 text-gray-700"
                        />
                        <Input
                          readOnly
                          value={field.description}
                          className="flex-grow bg-gray-100 text-gray-700"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTiebreaker(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {availableTiebreakers.length > 0 && (
          <div className="flex items-end gap-2 mt-4 pt-4 border-t">
              <div className="flex-grow">
                  <Label>Add New Tiebreaker</Label>
                  <Select value={nextTiebreaker} onValueChange={setNextTiebreaker}>
                      <SelectTrigger><SelectValue placeholder="Select a tiebreaker rule..." /></SelectTrigger>
                      <SelectContent>
                          {availableTiebreakers.map(tb => <SelectItem key={tb.rule} value={tb.rule}>{tb.rule.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <Button type="button" variant="secondary" onClick={handleAddTiebreakerRule}>Add Tiebreaker</Button>
          </div>
      )}
      
      {/* Display form-wide errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          <p className="font-semibold">Please correct the following errors:</p>
          <ul className="list-disc list-inside mt-2">
            {Object.keys(errors).map(key => {
              const error = errors[key as keyof CreateLeagueDto];
              return (
                <li key={key}>
                  {key}: {error?.message as string || 'Invalid value'}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
