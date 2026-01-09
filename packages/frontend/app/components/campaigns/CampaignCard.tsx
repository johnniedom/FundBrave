"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import Link from "next/link";

// Campaign card props interface - keeping original structure
export interface CampaignCardProps {
  id: string;
  title: string;
  imageUrl: string;
  donorsCount: number;
  amountRaised: number;
  targetAmount: number;
  currency?: string;
}

/**
 * CampaignCard - A card component displaying campaign information
 * Shows campaign image, title, donation progress, and a link to view the campaign
 * Features GSAP micro-interactions: hover lift and progress bar animation
 */
export default function CampaignCard({
  id,
  title,
  imageUrl,
  donorsCount,
  amountRaised,
  targetAmount,
  currency = "USD",
}: CampaignCardProps) {
  // Calculate progress percentage for the progress bar
  const progress = Math.min((amountRaised / targetAmount) * 100, 100);

  // Format numbers with commas for better readability
  const formatNumber = (num: number) => num.toLocaleString();

  // GSAP refs
  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Animate progress bar on mount
  useEffect(() => {
    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { width: 0 },
        { width: `${progress}%`, duration: 1, ease: "power2.out", delay: 0.3 }
      );
    }

    return () => {
      gsap.killTweensOf([cardRef.current, progressRef.current]);
    };
  }, [progress]);

  // Hover animations
  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: -4,
      boxShadow: "0 10px 30px rgba(69, 12, 240, 0.2)",
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: "none",
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-[#09011a] rounded-[12px] overflow-hidden w-full flex flex-col gap-4 cursor-pointer"
    >
      {/* Image Container - Responsive height based on screen size */}
      <div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[255px] w-full relative rounded-lg overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 items-start px-1 pb-4">
        <h3 className="text-white text-[20px] font-semibold leading-[30px] tracking-[0.48px] font-['Poppins']">
          {title}
        </h3>

        <div className="w-full flex flex-col gap-3">
          <p className="text-[rgba(255,255,255,0.6)] text-[14px] leading-[21px] tracking-[0.56px] font-['Roboto']">
            {formatNumber(donorsCount)} members donated
          </p>

          {/* Progress Bar */}
          <div className="w-full h-[10px] bg-[rgba(255,255,255,0.1)] rounded-[16px] relative overflow-hidden">
            <div
              ref={progressRef}
              className="absolute top-0 left-0 h-full rounded-[16px]"
              style={{
                width: 0,
                backgroundImage:
                  "linear-gradient(150.051deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
              }}
            />
          </div>

          <p className="text-[rgba(255,255,255,0.8)] text-[14px] leading-[21px] tracking-[0.56px] font-['Roboto']">
            <span className="font-bold">
              {formatNumber(amountRaised)} {currency}
            </span>{" "}
            raised of {formatNumber(targetAmount)} {currency} target
          </p>
        </div>

        {/* View Campaign Link */}
        <Link href={`/campaigns/${id}`} className="mt-1 cursor-pointer group">
          <div className="flex flex-col gap-[2px]">
            <span
              className="text-transparent bg-clip-text font-semibold text-[16px] tracking-[0.64px] font-['Montserrat']"
              style={{
                backgroundImage:
                  "linear-gradient(125.106deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
              }}
            >
              View Campaign
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
