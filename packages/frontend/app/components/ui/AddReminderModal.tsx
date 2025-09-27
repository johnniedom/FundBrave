"use client";

import React from "react";
import { X } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";
import {
  AppleIcon,
  GoogleIcon,
  OutlookIcon,
  OutlookWebIcon,
  YahooIcon,
} from "./icons";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderSelect: (provider: string) => void;
}

/**
 * Email provider configuration using reusable SVG components
 * Each provider includes an ID, display name, and corresponding icon component
 */

const emailProviders = [
  {
    id: "apple",
    name: "Apple",
    icon: AppleIcon,
  },
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: OutlookIcon,
  },
  {
    id: "outlook-web",
    name: "Outlook Web",
    icon: OutlookWebIcon,
  },
  {
    id: "yahoo",
    name: "Yahoo",
    icon: YahooIcon,
  },
];

export default function AddReminderModal({
  isOpen,
  onClose,
  onProviderSelect,
}: AddReminderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <RemoveScroll>
        <div className="bg-brand-dark rounded-[20px] w-full max-w-[717px] min-h-[540px] relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            type="button"
            className="absolute top-[37px] right-[51px] w-6 h-6 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center justify-center min-h-[540px] px-8 py-12">
            <div className="w-[404px] max-w-full">
              {/* Header */}
              <div className="text-center mb-7">
                <h2 className="font-['Poppins'] font-medium text-[20px] text-white leading-[30px] tracking-[0.48px] mb-1.5">
                  Add a reminder
                </h2>
                <p className="font-['Roboto'] font-normal text-[16px] text-white/80 leading-[24px] tracking-[0.3072px] max-w-[352px] mx-auto">
                  Don&apos;t worry if you are not ready to donate yet, we can
                  remind you before the fundraising ends
                </p>
              </div>

              {/* Email Provider Options */}
              <div className="space-y-5">
                {emailProviders.map((provider) => {
                  const IconComponent = provider.icon;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => onProviderSelect(provider.id)}
                      className="w-full h-14 px-[9px] py-[18px] border border-white rounded-[20px] flex items-center gap-[9px] hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-[34px] h-[34px] flex items-center justify-center text-white">
                        <IconComponent />
                      </div>
                      <span className="font-['Roboto'] font-semibold text-[18px] text-white leading-[24px] tracking-[0.3456px] flex-1 text-center">
                        {provider.name}
                      </span>
                      {/* Spacer div to center the text */}
                      <div className="w-[34px]"></div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </RemoveScroll>
    </div>
  );
}
