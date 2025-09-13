"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StepperProps {
  steps: {
    name: string;
    icon: LucideIcon;
  }[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={index}>
            <div className="space-x-2">
              <div className="flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${index === currentStep ? "bg-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-500"}
                  ${index < currentStep ? "bg-green-500 text-white" : ""}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <span
                className={`text-sm hidden sm:inline-block transition-all duration-300 ${
                  index === currentStep ? "text-blue-600 font-semibold" : "text-gray-500"
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${index < currentStep ? "bg-blue-600" : ""}`}
                  style={{ width: index < currentStep ? "100%" : "0" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
