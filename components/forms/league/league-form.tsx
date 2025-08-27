"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '@/services/api';
import { CreateLeagueSchema, CreateLeagueDto } from '@/schemas/league-schemas';
import { useAuthStore } from '@/store/auth.store';
import Step1_BasicInfo from './step1-basic-info';
import Step2_BusinessProfile from './step2-business-profile';
import Step3_Rules from './step3-rules';
import Step4_Review from './step4-review';
import { Gender, LeagueVisibility, Roles } from '@/schemas';
import axios from 'axios';

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
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes(Roles.SYSTEM_ADMIN);

  // Initialize react-hook-form with the full schema
  const methods = useForm<CreateLeagueDto>({
  resolver: zodResolver(CreateLeagueSchema),
  defaultValues: {
    name: '',
    division: 'D1',
    gender: Gender.MALE,
    visibility: LeagueVisibility.PUBLIC,
    tenantId: isSystemAdmin ? '' : user?.tenantId || '',
    isActive: true,
    businessProfile: {
      description: '',
      logoUrl: '',
      bannerImageUrl: '',
      physicalAddress: '',
      city: '',
      region: '',
    },
    pointSystemConfig: {
      rules: [],
    },
    tieBreakerConfig: [],
  },
});;

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

  // Function to render the step-by-step guidance
  const renderStepper = () => (
    <div className="flex justify-between items-center mb-6 w-full text-center">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.name} className="flex flex-col items-center flex-1 relative">
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: isCompleted ? '#22c55e' : (isCurrent ? '#3b82f6' : '#e5e7eb'),
                color: isCurrent ? '#fff' : (isCompleted ? '#fff' : '#4b5563')
              }}>
              {isCompleted ? (
                <CheckCircle size={16} />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <div className={`mt-2 text-sm transition-colors duration-200 ${isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step.name}</div>
            {index < steps.length - 1 && (
              <div className="absolute top-4 left-1/2 w-[calc(100%+16px)] -translate-x-1/2 -z-10 transition-colors duration-200 h-1 rounded-full"
                style={{ backgroundColor: isCompleted ? '#22c55e' : '#e5e7eb' }}></div>
            )}
          </div>
        );
      })}
    </div>
  );

  const handleNext = async () => {
    // Determine which fields to validate based on the current step
    let isValid = false;
    switch (currentStep) {
      case 0:
        isValid = await trigger(['name', 'tenantId', 'parentLeagueId', 'division', 'gender', 'visibility', 'ownerId']);
        break;
      case 1:
        isValid = await trigger(['businessProfile.description', 'businessProfile.region', 'businessProfile.city']);
        break;
      case 2:
        isValid = await trigger(['pointSystemConfig', 'tieBreakerConfig']);
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fill out all required fields.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: CreateLeagueDto) => {
    setLoading(true);
    try {
      const payload = isSystemAdmin ? data : { ...data, tenantId: user?.tenantId };
      const response = await api.post('/leagues', payload);
      toast.success('League created successfully!');
      onSuccess(response.data.id);
    } catch (error) {
      let errorMessage = "League creation failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <FormProvider {...methods}>
      <div className="p-4 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
        {renderStepper()}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CurrentStepComponent />

          <div className="flex justify-between space-x-4 pt-4 m-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting || loading} className="flex items-center space-x-2">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button type="button" onClick={handleNext} disabled={isSubmitting || loading} className="flex items-center space-x-2">
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting || loading} className="flex items-center space-x-2">
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
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
