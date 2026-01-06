"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import type { EarningRecord } from "@/app/types/earnings";

/**
 * EarningsTable - Displays all earnings with withdraw action
 * Figma specs:
 * - Header: "All Earnings" with search icon and "View All" dropdown
 * - Columns: Amount | Type | Date | Action
 * - Withdraw button: Primary gradient, rounded
 * - Table: bg-transparent, border-white/10, rounded-xl
 */

export interface EarningsTableProps {
  earnings: EarningRecord[];
  onWithdraw: (earningId: string) => void;
  className?: string;
}

export function EarningsTable({
  earnings,
  onWithdraw,
  className,
}: EarningsTableProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, handleClickOutside]);

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <div
      className={cn(
        "bg-[#1a1625]/40 border border-white/10 rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">All Earnings</h3>

        <div className="flex items-center gap-3">
          {/* Search Icon */}
          <button
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Search earnings"
          >
            <Search className="w-5 h-5 text-white/60" />
          </button>

          {/* View All Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm text-white/80">View All</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-white/60 transition-transform",
                  isDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-neutral-dark-400 border border-white/10 rounded-lg shadow-xl z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                  All
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                  Donations
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                  Points
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table - min-width ensures table doesn't collapse on mobile */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-auto-hide">
        <table className="w-full min-w-[600px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-5 py-3 text-left text-sm font-medium text-white/60">
                Amount
              </th>
              <th className="px-5 py-3 text-left text-sm font-medium text-white/60">
                Type
              </th>
              <th className="px-5 py-3 text-left text-sm font-medium text-white/60">
                Date
              </th>
              <th className="px-5 py-3 text-left text-sm font-medium text-white/60">
                Action
              </th>
              <th className="px-3 py-3 w-12"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {earnings.map((earning) => (
              <tr
                key={earning.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Amount */}
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-white">
                    {formatAmount(earning.amount, earning.currency)}
                  </span>
                </td>

                {/* Type */}
                <td className="px-5 py-4">
                  <span className="text-sm text-white/80">{earning.type}</span>
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <span className="text-sm text-white/60">{earning.date}</span>
                </td>

                {/* Action */}
                <td className="px-5 py-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onWithdraw(earning.id)}
                    className="text-xs px-4 py-1.5 h-8 rounded-lg"
                  >
                    Withdraw
                  </Button>
                </td>

                {/* More Options */}
                <td className="px-3 py-4">
                  <button
                    className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-4 h-4 text-white/60" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {earnings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-white/40 text-sm">No earnings yet</p>
        </div>
      )}
    </div>
  );
}

export default EarningsTable;
