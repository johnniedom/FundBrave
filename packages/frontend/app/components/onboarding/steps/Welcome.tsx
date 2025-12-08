"use client";

import React from "react";
import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useRouter } from "next/navigation";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";

const Welcome: React.FC<StepComponentProps> = ({ onBack }) => {
  const router = useRouter();
  const { markComplete } = useOnboardingData();

  const handleGoHome = () => {
    // Mark onboarding as complete and navigate to home
    markComplete();
    router.push("/");
  };

  return (
    <motion.div
      className="text-center px-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Success animation */}
      <motion.div
        className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-white" />
      </motion.div>

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
        You're all set!
      </h2>
      <p className="text-gray-400 mb-8 text-sm md:text-base">
        Welcome to FundBrave. You're ready to start your journey.
      </p>

      {/* Final action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="py-3 px-6 bg-slate-700 rounded-lg text-white font-semibold hover:bg-slate-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
        )}
        <motion.button
          onClick={handleGoHome}
          className="py-3 px-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Go to Home
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Welcome;

