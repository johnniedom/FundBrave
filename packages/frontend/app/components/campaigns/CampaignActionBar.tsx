"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Share2, Bell, Calendar } from "lucide-react";
import ShareCampaignModal from "@/app/components/ui/ShareCampaignModal";
import AddReminderModal from "@/app/components/ui/AddReminderModal";
import { cn } from "@/lib/utils";

interface CampaignData {
  id: string;
  title: string;
  url?: string;
  endDate?: Date;
  description?: string;
}

interface CampaignActionBarProps {
  /** Campaign data for sharing and reminders */
  campaign: CampaignData;
  /**
   * Visual variant:
   * - "buttons": Full-width buttons with text (for campaign detail page)
   * - "icons": Icon-only buttons (for cards)
   * - "compact": Small text links (for profile donations)
   */
  variant?: "buttons" | "icons" | "compact";
  /** Whether to show the donate button */
  showDonate?: boolean;
  /** Additional class names */
  className?: string;
  /** Callback when share is completed */
  onShare?: (network: string) => void;
  /** Callback when reminder is set */
  onReminderSet?: (provider: string) => void;
}

/**
 * CampaignActionBar - Reusable component for share and reminder actions
 * Handles modal state internally for maximum reusability
 */
export default function CampaignActionBar({
  campaign,
  variant = "buttons",
  showDonate = false,
  className,
  onShare,
  onReminderSet,
}: CampaignActionBarProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const campaignUrl =
    campaign.url || `https://fundbrave.com/campaigns/${campaign.id}`;
  const campaignEndDate = campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now

  const handleShare = (network: string) => {
    onShare?.(network);
  };

  const handleReminderSet = (provider: string) => {
    onReminderSet?.(provider);
  };

  // Render based on variant
  if (variant === "icons") {
    return (
      <>
        <div className={cn("flex items-center gap-2", className)}>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Share campaign"
            title="Share"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={() => setIsReminderModalOpen(true)}
            className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Set reminder"
            title="Set reminder"
          >
            <Bell size={18} />
          </button>
        </div>

        {/* Modals */}
        <ShareCampaignModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          campaignUrl={campaignUrl}
          campaignTitle={campaign.title}
          onShare={handleShare}
        />
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          campaignTitle={campaign.title}
          campaignEndDate={campaignEndDate}
          campaignUrl={campaignUrl}
          campaignDescription={campaign.description}
          onReminderSet={handleReminderSet}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-white/50",
            className
          )}
        >
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            onClick={() => setIsReminderModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Calendar size={14} />
            <span>Remind</span>
          </button>
        </div>

        {/* Modals */}
        <ShareCampaignModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          campaignUrl={campaignUrl}
          campaignTitle={campaign.title}
          onShare={handleShare}
        />
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          campaignTitle={campaign.title}
          campaignEndDate={campaignEndDate}
          campaignUrl={campaignUrl}
          campaignDescription={campaign.description}
          onReminderSet={handleReminderSet}
        />
      </>
    );
  }

  // Default: buttons variant
  return (
    <>
      <div
        className={cn(
          "flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full",
          className
        )}
      >
        {showDonate && (
          <Link href={`/campaigns/${campaign.id}/donate`} className="flex-1">
            <button className="w-full h-12 sm:h-14 rounded-full bg-gradient-to-r from-primary-600 to-soft-purple-500 text-white font-bold text-sm sm:text-base tracking-wide hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-[1.01]">
              Donate
            </button>
          </Link>
        )}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex-1 h-12 sm:h-14 rounded-full border border-border-subtle text-white font-bold text-sm sm:text-base tracking-wide hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 size={18} />
          Share
        </button>
        <button
          onClick={() => setIsReminderModalOpen(true)}
          className="flex-1 h-12 sm:h-14 rounded-full border border-border-subtle text-white font-bold text-sm sm:text-base tracking-wide hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar size={18} />
          Remind Me
        </button>
      </div>

      {/* Modals */}
      <ShareCampaignModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignUrl={campaignUrl}
        campaignTitle={campaign.title}
        onShare={handleShare}
      />
      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        campaignTitle={campaign.title}
        campaignEndDate={campaignEndDate}
        campaignUrl={campaignUrl}
        campaignDescription={campaign.description}
        onReminderSet={handleReminderSet}
      />
    </>
  );
}
