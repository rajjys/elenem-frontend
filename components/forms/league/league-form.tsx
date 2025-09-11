"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ChevronRight, ChevronLeft, ListTodo, User, ClipboardList, Eye, X } from 'lucide-react';
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
  { name: "Basic Info", icon: ListTodo, component: Step1_BasicInfo },
  { name: "Business Profile", icon: User, component: Step2_BusinessProfile },
  { name: "Point System & Rules", icon: ClipboardList, component: Step3_Rules },
  { name: "Review & Submit", icon: Eye, component: Step4_Review },
];

interface LeagueFormProps {
  onSuccess: (tenantId: string) => void;
  onCancel: () => void;
}

export function LeagueCreationForm({ onSuccess, onCancel } : LeagueFormProps) {
  
  const { user: userAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const isSystemAdmin = userAuth?.roles.includes(Roles.SYSTEM_ADMIN);

  // Initialize react-hook-form with the full schema
  const methods = useForm<CreateLeagueDto>({
  resolver: zodResolver(CreateLeagueSchema),
  defaultValues: {
    name: '',
    division: 'D1',
    gender: Gender.MALE,
    visibility: LeagueVisibility.PUBLIC,
    tenantId: isSystemAdmin ? '' : userAuth?.tenantId || '',
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
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="space-x-2">
            <div className="flex items-center justify-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${index === currentStep ? "bg-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-500"}
                  ${index < currentStep ? "bg-green-500 text-white" : ""}
                `}
              >
                <step.icon size={20} />
              </div>
            </div>
            <span
              className={`text-sm hidden sm:inline-block transition-all duration-300 ${
                index === currentStep
                  ? "text-blue-600 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  index < currentStep ? "bg-blue-600" : ""
                }`}
                style={{ width: index < currentStep ? "100%" : "0" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
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
      const payload = isSystemAdmin ? data : { ...data, tenantId: userAuth?.tenantId };
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
              variant="danger"
              onClick={onCancel}
              className="flex items-center space-x-2"
              disabled={isSubmitting || loading}
            >
              <X size={16} />
              <span>Cancel</span>
            </Button>
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleBack} 
                  disabled={isSubmitting || loading} className="flex items-center space-x-2">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={isSubmitting || loading} 
                  className="flex items-center space-x-2">
                  <span>Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || loading} 
                  className="flex items-center space-x-2">
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
