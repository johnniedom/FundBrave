"use client";

import React from "react";
import { useOnboarding } from "@/app/provider/OnboardingContext";
import { StepItem } from "./StepItem";
import { ConnectingLine } from "./ConnectingLine";
import Image from "next/image";

/**
 * Desktop sidebar component that displays all onboarding steps
 * with connecting lines and animations
 */
export const OnboardingAside = () => {
  const { steps, currentStepIndex } = useOnboarding();

  return (
    <aside
      className="hidden md:flex w-full md:w-1/3 bg-neutral-dark-500/50 p-6 md:p-12 flex-col justify-between relative md:rounded-l-2xl isolate"
      style={{
        background: "linear-gradient(to bottom, var(--primary-500) 0%, var(--neutral-dark-500) 50%)",
        transformOrigin: "top",
      }}
    >
      {/* Logo and brand */}
      <div>
        <div className="flex items-center gap-3 text-white mb-8 md:mb-16">
          <div className="w-10 h-10 rounded-lg">
            <Image
              src={"/Funbrave_icon_dark.png"}
              alt="FundBrave logo"
              fill
              className="w-[150px]"
            />
          </div>
          <span className="text-2xl font-bold">FundBrave</span>
        </div>

        {/* Steps with connecting lines */}
        <div className="relative">
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
              <div key={step.slug}>
                <StepItem {...step} status={status} index={index} />

                {/* Render connecting line between steps */}
                <ConnectingLine
                  index={index}
                  totalSteps={steps.length}
                  currentStepIndex={currentStepIndex}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer link */}
      <div className="text-muted-foreground text-sm">
        <a
          href="/"
          className="hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <span>&larr;</span>
          <span>Back to home</span>
        </a>
      </div>
    </aside>
  );
};
