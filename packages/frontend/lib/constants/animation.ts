/**
 * Shared animation constants for consistent motion across the app
 */

// Organic flow easing - smooth, natural feel
export const EASE_ORGANIC = [0.32, 0.72, 0, 1] as const;

// Common durations
export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  medium: 0.4,
  slow: 0.6,
} as const;
