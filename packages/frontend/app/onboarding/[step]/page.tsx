"use client";

import { motion, AnimatePresence } from "motion/react";
import { notFound } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";
import { useOnboarding } from "@/app/provider/OnboardingContext";

import { use } from "react";

interface OnboardingStepPageProps {
  params: Promise<{
    step: string;
  }>;
}

export default function OnboardingStepPage({
  params,
}: OnboardingStepPageProps) {
  const { step: stepSlug } = use(params);
  const { nextStep, prevStep } = useOnboarding();

  // Find the step details by slug
  const stepDetails = ONBOARDING_STEPS.find((s) => s.slug === stepSlug);

  // Redirect to 404 if the step slug is invalid
  if (!stepDetails) {
    notFound();
  }

  const { Component } = stepDetails;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepSlug}
        initial={{ opacity: 0, x: 100, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          opacity: { duration: 0.2 },
        }}
        className="w-full h-full flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #09011A 0%, #09011A 50%)",
          transformOrigin: "top",
        }}
      >
        <Component onNext={nextStep} onBack={prevStep} />
      </motion.div>
    </AnimatePresence>
  );
}
