"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { WithdrawalRecord } from "@/app/types/earnings";

/**
 * WithdrawalHistoryTable - Displays withdrawal history with status badges
 * Figma specs:
 * - Header: "Withdrawal History" with search icon and "View All" dropdown
 * - Columns: Amount | Type | Date | Status
 * - Status: Paid (green) or Pending (yellow/orange) badges
 * - Table: bg-transparent, border-white/10, rounded-xl
 */

export interface WithdrawalHistoryTableProps {
  withdrawals: WithdrawalRecord[];
  className?: string;
}

export function WithdrawalHistoryTable({
  withdrawals,
  className,
}: WithdrawalHistoryTableProps) {
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
        <h3 className="text-lg font-semibold text-white">Withdrawal History</h3>

        <div className="flex items-center gap-3">
          {/* Search Icon */}
          <button
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Search withdrawals"
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
                  Paid
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                  Pending
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-auto-hide">
        <table className="w-full">
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
                Status
              </th>
              <th className="px-3 py-3 w-12"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr
                key={withdrawal.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Amount */}
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-white">
                    {formatAmount(withdrawal.amount, withdrawal.currency)}
                  </span>
                </td>

                {/* Type */}
                <td className="px-5 py-4">
                  <span className="text-sm text-white/80">
                    {withdrawal.type}
                  </span>
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <span className="text-sm text-white/60">
                    {withdrawal.date}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusBadge status={withdrawal.status} />
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
      {withdrawals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-white/40 text-sm">No withdrawal history</p>
        </div>
      )}
    </div>
  );
}

export default WithdrawalHistoryTable;
