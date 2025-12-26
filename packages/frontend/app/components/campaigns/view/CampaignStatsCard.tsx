"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { CampaignActionBar } from "@/app/components/campaigns";

interface CampaignData {
  id: string;
  title: string;
  url?: string;
  endDate?: Date;
  description?: string;
}

interface CampaignStatsCardProps {
  amountRaised: number;
  targetAmount: number;
  supportersCount: number;
  daysLeft: number;
  campaign: CampaignData;
}

export default function CampaignStatsCard({
  amountRaised,
  targetAmount,
  supportersCount,
  daysLeft,
  campaign,
}: CampaignStatsCardProps) {
  const percentage = Math.min(
    Math.round((amountRaised / targetAmount) * 100),
    100
  );

  // Calculate circle circumference for SVG stroke-dasharray
  // Radius = 70 (150px width / 2 - stroke width)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        {/* Progress Circle - Responsive sizing */}
        <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex items-center justify-center">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              stroke="#2A2A35"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex items-center justify-center inset-0">
            <span className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-family-gilgan)]">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats Text */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-white font-[family-name:var(--font-family-gilgan)] tracking-wider">
            {amountRaised.toLocaleString()} USD
          </h3>
          <div className="text-sm text-white/60 font-medium">
            <p className="mb-1">
              Raised of{" "}
              <span className="font-bold text-white">
                {targetAmount.toLocaleString()} USD
              </span>{" "}
              target by
            </p>
            <p>
              <span className="font-bold text-white">
                {supportersCount.toLocaleString()}
              </span>{" "}
              supporters
            </p>
          </div>
          <p className="text-xs text-purple-400 font-semibold pt-3 uppercase tracking-wide">
            Campaign ending in {daysLeft} weeks
          </p>
        </div>

        {/* Action Buttons - Using CampaignActionBar */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          <Link href={`/campaigns/${campaign.id}/donate`} className="w-full">
            <button className="w-full h-11 sm:h-12 rounded-full bg-gradient-to-r from-primary-600 to-soft-purple-500 text-white font-semibold text-sm sm:text-base tracking-wide hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all transform hover:scale-[1.02]">
              Donate Now
            </button>
          </Link>
          <CampaignActionBar
            campaign={campaign}
            variant="buttons"
            showDonate={false}
          />
        </div>
      </div>

      {/* Reminder Section - Decorative only, CampaignActionBar handles the actual reminder */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 py-4 sm:py-6 border-t border-border-subtle">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center mb-1 sm:mb-2">
          <Calendar className="text-purple-400" size={18} />
        </div>
        <p className="text-white/60 text-sm">Can&apos;t donate right now?</p>
        <p className="text-white/40 text-xs">
          Use the &quot;Remind Me&quot; button above to set a reminder
        </p>
      </div>
    </div>
  );
}
