"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";

const VerifyEmail: React.FC<StepComponentProps> = ({ onNext }) => {
  const { data } = useOnboardingData();
  const [codes, setCodes] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(4).fill(null));

  // Get email from context, fallback to placeholder if empty
  const userEmail = data.email || "your email";

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input if value is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      className="text-center w-full px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Verify your email
      </h2>
      <p className="text-gray-400 mb-8 text-sm md:text-base">
        We sent a code to <span className="text-purple-400">{userEmail}</span>
      </p>

      {/* Verification code inputs */}
      <div className="flex justify-center gap-2 md:gap-3 mb-8">
        {codes.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl text-center bg-slate-900 rounded-lg text-white border border-gray-700 focus:border-purple-500 outline-none transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        ))}
      </div>

      <p className="text-gray-400 mb-6 text-sm md:text-base">
        Didn't get a code?{" "}
        <button className="text-purple-400 hover:text-purple-300 transition-colors">
          Click to resend
        </button>
      </p>

      <motion.button
        onClick={onNext}
        className="w-full max-w-xs py-3 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: "linear-gradient(97deg, #450CF0 0%, #CD82FF 100%)",
        }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
};

export default VerifyEmail;

