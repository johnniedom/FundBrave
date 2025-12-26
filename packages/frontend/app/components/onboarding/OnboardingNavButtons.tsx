"use client";

import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface OnboardingNavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  loadingLabel?: string;
  backLabel?: string;
  animationDelay?: number;
  backWidth?: string;
  nextWidth?: string;
}

/**
 * Shared navigation buttons for onboarding steps.
 * Eliminates duplicated button styling across ProfileDetail, SocialProfile, Goals, etc.
 */
const OnboardingNavButtons: React.FC<OnboardingNavButtonsProps> = ({
  onBack,
  onNext,
  isLoading = false,
  nextLabel = "Next",
  loadingLabel = "Saving...",
  backLabel = "Back",
  animationDelay = 0.6,
  backWidth = "w-[200px]",
  nextWidth = "w-[200px]",
}) => {
  return (
    <motion.div
      className="flex gap-4 items-center justify-center w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      {onBack && (
        <button
          onClick={onBack}
          disabled={isLoading}
          className={`${backWidth} h-14 px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-[#450cf0] rounded-[20px] text-white font-semibold text-base tracking-wide backdrop-blur-md shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)] hover:bg-[rgba(69,12,240,0.15)] transition-colors disabled:opacity-50`}
        >
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={isLoading}
          className={`${nextWidth} h-14 px-8 py-4 rounded-[20px] text-white font-semibold text-lg tracking-wide shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2`}
          style={{
            background: "linear-gradient(97deg, #450CF0 0%, #CD82FF 100%)",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loadingLabel}
            </>
          ) : (
            nextLabel
          )}
        </button>
      )}
    </motion.div>
  );
};

export default OnboardingNavButtons;
