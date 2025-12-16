/**
 * Constants for CreatePost component
 */

import type { UserProfile } from "../types/CreatePost.types";

export const DEFAULT_USER: UserProfile = {
  name: "Anna Doe",
  avatar: "/api/placeholder/42/42",
  audience: "Publish to anyone",
};

export const DEFAULT_CAMPAIGN_CATEGORIES: string[] = [
  "Health and Medical",
  "Education",
  "Community",
  "Emergency",
  "Animals",
  "Environment",
];

export const DEFAULT_USER_CAMPAIGNS: string[] = [
  "Support John's Fight Against Cancer",
  "Help Build School Library",
  "Community Garden Project",
];

export const FORM_DIMENSIONS = {
  POST_FORM_WIDTH: "559px",
  CAMPAIGN_UPDATE_FORM_WIDTH: "554px",
  DEFAULT_TEXTAREA_HEIGHT: "272px",
  CAMPAIGN_UPDATE_TEXTAREA_HEIGHT: "188px",
} as const;

export const MODAL_CONFIG = {
  MAX_WIDTH: "843px",
  MAX_HEIGHT: "90vh",
  PADDING_X: "142px",
  PADDING_Y: "37px",
  CONTENT_MAX_HEIGHT: "calc(90vh-240px)",
} as const;
