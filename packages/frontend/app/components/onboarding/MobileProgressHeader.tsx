"use client";

import React from "react";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { MobileStepItem } from "./StepItem";
import { ConnectingLineHorizontal } from "./ConnectingLine";
import Image from "next/image";

/**
 * Mobile header component with horizontal progress indicator
 * Shows current step and progress through all steps
 */
export const MobileProgressHeader = () => {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <div className="md:hidden w-full bg-neutral-dark-500/50 p-6 rounded-t-2xl isolate">
      {/* Logo */}
      <div className="flex items-center gap-3 text-white mb-6">
        <Image
          src={"/Fundbrave_icon_light.png"}
          alt="FundBrave logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <span className="text-xl font-bold">FundBrave</span>
      </div>

      {/* Horizontal step indicators */}
      <div className="flex items-center">
        {steps.map((step, index) => {
          const status =
            currentStepIndex > index
              ? "completed"
              : currentStepIndex === index
              ? "active"
              : currentStepIndex + 1 === index
              ? "next"
              : "inactive";

          return (
            <React.Fragment key={step.slug}>
              <MobileStepItem Icon={step.Icon} status={status} />

              {/* Connecting line */}
              <ConnectingLineHorizontal
                index={index}
                totalSteps={steps.length}
                currentStepIndex={currentStepIndex}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step title */}
      <div className="mt-4 text-center">
        <p className="text-white font-semibold">
          {steps[currentStepIndex].title}
        </p>
        <p className="text-muted-foreground text-sm">
          {steps[currentStepIndex].subtitle}
        </p>
      </div>
    </div>
  );
};
