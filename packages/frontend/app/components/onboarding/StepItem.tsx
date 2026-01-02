"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import { ComponentType } from "react";

type StepStatus = "completed" | "active" | "inactive" | "next";

interface StepItemProps {
  Icon: ComponentType<{ className?: string; useGradient?: boolean }>;
  title: string;
  subtitle: string;
  status: StepStatus;
  index: number;
}

/**
 * Step item component for desktop sidebar
 * Shows icon, title, subtitle, and visual state (inactive/active/completed)
 */
export const StepItem = ({ Icon, title, subtitle, status }: StepItemProps) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNext = status === "next";

  return (
    <div className="flex items-center gap-4 rounded-lg transition-all duration-300">
      {/* Animated circle with icon - pulses when active */}
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        animate={{
          backgroundColor: isCompleted
            ? "#8B5CF6"
            : isActive
            ? "#8B5CF6"
            : "#1e293b",
          borderWidth: isInactive || isNext ? 2 : 0,
          borderColor: isInactive || isNext ? "#475569" : "transparent",
          scale: isActive ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: isActive ? 2 : 0.3,
          scale: {
            repeat: isActive ? Infinity : 0,
            repeatType: "reverse",
            duration: 2,
            ease: "easeInOut",
          },
        }}
      >
        {/* Show checkmark for completed steps, icon for others */}
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Check className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Icon
                useGradient={isNext}
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Step text content */}
      <motion.div
        animate={{
          color: isActive || isCompleted ? "#ffffff" : "#9ca3af",
        }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-75">{subtitle}</p>
      </motion.div>
    </div>
  );
};

/**
 * Mobile step item component (circle only)
 * Compact version for mobile progress header
 */
export const MobileStepItem = ({
  Icon,
  status,
}: Omit<StepItemProps, "title" | "subtitle" | "index">) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNext = status === "next";

  return (
    <motion.div
      className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      animate={{
        backgroundColor: isCompleted
          ? "#8B5CF6"
          : isActive
          ? "#8B5CF6"
          : "#1e293b",
        borderWidth: isInactive || isNext ? 2 : 0,
        borderColor: isInactive || isNext ? "#475569" : "transparent",
        scale: isActive ? [1, 1.15, 1] : 1,
      }}
      transition={{
        duration: isActive ? 2 : 0.3,
        scale: {
          repeat: isActive ? Infinity : 0,
          repeatType: "reverse",
          duration: 2,
          ease: "easeInOut",
        },
      }}
    >
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Icon
              useGradient={isNext}
              className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
