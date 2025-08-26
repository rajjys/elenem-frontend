"use client";

import React, { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { CreateLeagueSchema, CreateLeagueDto } from '@/schemas/league-schemas';
import { useAuthStore } from '@/store/auth.store';
import Step1_BasicInfo from './step1-basic-info';
import Step2_BusinessProfile from './step2-business-profile';
import Step3_Rules from './step3-rules';
import Step4_Review from './step4-review';
import { Gender, Roles } from '@/schemas';

// Define the steps and their corresponding components
const steps = [
  { name: 'Basic Info', component: Step1_BasicInfo },
  { name: 'Business Profile', component: Step2_BusinessProfile },
  { name: 'Point System & Rules', component: Step3_Rules },
  { name: 'Review & Submit', component: Step4_Review },
];

interface LeagueFormProps {
  onSuccess: (tenantId: string) => void;
  onCancel: () => void;
}

export function LeagueCreationForm({ onSuccess, onCancel } : LeagueFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore(); // Assuming user has roles and tenantId
  const isSystemAdmin = user?.roles.includes(Roles.SYSTEM_ADMIN);

  const methods = useForm({
    resolver: zodResolver(CreateLeagueSchema),
    defaultValues: useMemo(() => {
      // Set the tenantId automatically for TENANT_ADMIN
      const defaultValues = {
        tenantId: '',
        name: '',
        gender: Gender.MALE,
        businessProfile: {
        }
      };
      if (!isSystemAdmin && user?.tenantId) {
        defaultValues.tenantId = user.tenantId;
      }
      return defaultValues;
    }, [isSystemAdmin, user])
  });

  const { handleSubmit, formState, watch, setValue, getValues } = methods;
  const { isSubmitting, isValid } = formState;

  // Use watch to get the current values and handle dynamic state
  //const watchedValues = watch();

  const handleNext = async () => {
    // Validate the current step's fields before moving on
    const isValidStep = await methods.trigger();
    if (isValidStep) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast.error("Please fill out all required fields.");
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev > 0 ? prev - 1 : prev);
  };

  const onSubmit = async (data: CreateLeagueDto) => {
    setLoading(true);
    try {
      const response = await api.post('/leagues', data);
      toast.success('League created successfully!');
      onSuccess(response.data.id); // Pass the new league data
    } catch (error) {
      toast.error('Failed to create league.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Render the current step component */}
        <CurrentStepComponent />

        {/* Navigation buttons */}
        <div className="flex justify-end space-x-4 pt-4 m-2">
          {currentStep > 0 && (
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting || loading}>
              Back
            </Button>
          )}

          {currentStep < steps.length - 1 && (
            <Button type="button" onClick={handleNext} disabled={isSubmitting || loading}>
              Next
            </Button>
          )}

          {currentStep === steps.length - 1 && (
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Create League</span>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}