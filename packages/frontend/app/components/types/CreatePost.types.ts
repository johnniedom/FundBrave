export interface PostFormErrors {
  category?: string;
  title?: string;
  content?: string;
}

export interface CampaignUpdateFormErrors {
  category?: string;
  campaign?: string;
  title?: string;
  update?: string;
}

export interface MediaActionsProps {
  onImageClick: () => void;
  onGifClick: () => void;
  onPollClick: () => void;
  onEmojiClick: () => void;
  onCalendarClick: () => void;
  onLocationClick: () => void;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
}

export interface PublishData {
  type: PostType;
  category: string;
  title: string;
  content?: string;
  campaign?: string;
  update?: string;
}

export type PostType = "post" | "campaign-update";

export interface CreatePostProps {
  user: UserProfile;
  onPublish: (data: PublishData) => Promise<void>;
  campaignCategories: string[];
  userCampaigns: string[];
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

// Re-export form field types for convenience
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
}