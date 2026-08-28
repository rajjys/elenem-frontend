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
                  ${index === currentStep ? "bg-accent text-white shadow-lg" : "bg-line text-ink-muted"}
                  ${index < currentStep ? "bg-positive text-white" : ""}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <span
                className={`text-sm hidden sm:inline-block transition-all duration-300 ${
                  index === currentStep ? "text-accent-text font-semibold" : "text-ink-muted"
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-line mx-2 rounded-full">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${index < currentStep ? "bg-accent" : ""}`}
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
