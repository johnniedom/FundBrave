/**
 * Type definitions for CreatePost component
 */

export type PostType = "post" | "campaign-update";

export interface UserProfile {
  name: string;
  avatar: string;
  audience: string;
}

export interface PostData {
  type: "post";
  content: string;
}

export interface CampaignUpdateData {
  type: "campaign-update";
  category: string;
  campaign: string;
  title: string;
  update: string;
}

export type PublishData = PostData | CampaignUpdateData;

export interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: PublishData) => void;
  user?: UserProfile;
  campaignCategories?: string[];
  userCampaigns?: string[];
}

export interface MediaActionsProps {
  onImageClick?: () => void;
  onGifClick?: () => void;
  onPollClick?: () => void;
  onEmojiClick?: () => void;
  onCalendarClick?: () => void;
  onLocationClick?: () => void;
}

export interface PostFormErrors {
  content?: string;
}

export interface CampaignUpdateFormErrors {
  category?: string;
  campaign?: string;
  title?: string;
  update?: string;
}

export interface CreateCampaignUpdateFormProps {
  category: string;
  campaign: string;
  title: string;
  update: string;
  onCategoryChange: (category: string) => void;
  onCampaignChange: (campaign: string) => void;
  onTitleChange: (title: string) => void;
  onUpdateChange: (update: string) => void;
  onPublish: () => void;
  campaignCategories: string[];
  userCampaigns: string[];
  isPublishing?: boolean;
  mediaActions?: MediaActionsProps;
}

export interface CreatePostFormProps {
  content: string;
  onContentChange: (content: string) => void;
  onRewriteWithAI: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  mediaActions?: MediaActionsProps;
}
// Form Field Props Types
export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showMediaActions?: boolean;
  required?: boolean;
  mediaActions?: MediaActionsProps;
  disabled?: boolean;
  className?: string;
  id?: string;
}