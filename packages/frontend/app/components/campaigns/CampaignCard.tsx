"use client";

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

  return (
    <div className="bg-[#09011a] rounded-[12px] overflow-hidden w-full flex flex-col gap-4">
      {/* Image Container - Responsive height based on screen size */}
      <div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[255px] w-full relative rounded-[12px] overflow-hidden bg-[#d9d9d9]">
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
              className="absolute top-0 left-0 h-full rounded-[16px]"
              style={{
                width: `${progress}%`,
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
