/**
 * Earnings Dashboard Components
 * Barrel exports for the Creator Earnings Dashboard
 */

// Earnings-specific Components
export { StatusBadge } from "./StatusBadge";
export { StatsCard } from "./StatsCard";
export { EarningsTable } from "./EarningsTable";
export { WithdrawalHistoryTable } from "./WithdrawalHistoryTable";
export { WithdrawModal } from "./WithdrawModal";

// Re-export shared components from common/ for backward compatibility
export { Leaderboard, PremiumBanner, ProfileSidebar } from "@/app/components/common";

// Component Props Types
export type { StatusBadgeProps } from "./StatusBadge";
export type { StatsCardProps } from "./StatsCard";
export type { EarningsTableProps } from "./EarningsTable";
export type { WithdrawalHistoryTableProps } from "./WithdrawalHistoryTable";
export type { WithdrawModalProps } from "./WithdrawModal";

// Re-export shared component types from common/
export type {
  LeaderboardProps,
  PremiumBannerProps,
  ProfileSidebarProps,
} from "@/app/components/common";
