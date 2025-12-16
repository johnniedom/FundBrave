import React from "react";
import {
  Mail,
  UserRound,
  UsersRound,
  PencilLine,
  Rocket,
  LucideIcon,
} from "lucide-react";

import { cn } from "../../../lib/utils";

type StepIndicatorProps = {
  /**
   * Index of the active step (zero-based). Defaults to the first node.
   */
  activeStep?: number;
  /**
   * Optional className so the indicator can adapt to different layouts.
   */
  className?: string;
};

const stepIcons: LucideIcon[] = [
  Mail,
  UserRound,
  UsersRound,
  PencilLine,
  Rocket,
];

const connectorGradientActive =
  "linear-gradient(180deg, #8B5CF6 0%, #4C1D95 100%)";
const connectorGradientIdle =
  "linear-gradient(180deg, rgba(107, 107, 107, 0.55) 0%, rgba(33, 20, 54, 0.55) 100%)";

/**
 * FundBrave onboarding step indicator — faithfully recreates the vertical logo from Figma.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  activeStep = 0,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex w-12 flex-col items-center rounded-full bg-gradient-to-b from-[#1A093D] via-[#0F0427] to-[#040016] px-2 py-6",
        "shadow-[0_0_30px_rgba(76,29,149,0.35)]",
        className
      )}
    >
      {stepIcons.map((Icon, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        return (
          <React.Fragment key={Icon.displayName ?? index}>
            <div
              className={cn(
                "relative flex size-12 items-center justify-center rounded-full border border-[#6B6B6B]/45 bg-[#0C0328] transition-all duration-300",
                "before:absolute before:inset-[-6px] before:rounded-full before:opacity-0 before:transition-opacity before:duration-300",
                isActive &&
                  "border-transparent bg-gradient-to-b from-[#9F7AEA] via-[#7C3AED] to-[#5B21B6] text-white shadow-[0_0_18px_rgba(139,92,246,0.45)]",
                isActive && "before:bg-[#7C3AED]/35 before:opacity-100"
              )}
            >
              <Icon
                strokeWidth={isActive ? 1.8 : 1.6}
                className={cn(
                  "size-5 text-[#6B6B6B] transition-colors duration-300",
                  (isActive || isCompleted) && "text-white"
                )}
              />
            </div>

            {index < stepIcons.length - 1 && (
              <div className="flex flex-col items-center py-3">
                <div
                  aria-hidden
                  className="h-14 w-[2px] rounded-full"
                  style={{
                    background: isCompleted
                      ? connectorGradientActive
                      : connectorGradientIdle,
                    boxShadow: isCompleted
                      ? "0 0 14px rgba(124, 58, 237, 0.4)"
                      : "none",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
