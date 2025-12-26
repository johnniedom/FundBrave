"use client";

import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

/**
 * Primary gradient button used across the application.
 * Style: linear-gradient(97deg, var(--primary-500) 0%, var(--soft-purple-500) 100%)
 */
const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = "Loading...",
  className = "",
  type = "button",
  fullWidth = false,
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${fullWidth ? "w-full" : ""} 
        py-3 px-6 rounded-[20px] text-white font-semibold 
        hover:shadow-lg hover:shadow-purple-500/50 
        transition-all disabled:opacity-70
        flex items-center justify-center gap-2
        ${className}
      `}
      style={{
        background: "linear-gradient(97deg, var(--primary-500) 0%, var(--soft-purple-500) 100%)",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default GradientButton;
