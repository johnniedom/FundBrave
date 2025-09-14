"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  SelectField,
  InputField,
  TextAreaField,
} from "./ui/form/FormFields";
import {
  validatePostForm,
  validateCampaignUpdateForm,
  isFormValid,
  getFirstError,
} from "./utils/validation.utils";
import type {
  PostType,
  PublishData,
  CreatePostProps,
  PostFormErrors,
  CampaignUpdateFormErrors,
  CreateCampaignUpdateFormProps,
  MediaActionsProps,
} from "./types/CreatePost.types";

// Constants
const POST_CATEGORIES = [
  "Technology",
  "Arts & Crafts",
  "Community",
  "Education",
  "Environment",
  "Health",
  "Social Impact",
  "Innovation",
];

const MOCK_USER_CAMPAIGNS = [
  "Save the Ocean Campaign",
  "Tech for All Initiative",
  "Green Energy Project",
  "Education Access Fund",
];

// Post Type Toggle Component
const PostTypeToggle: React.FC<{
  selectedType: PostType;
  onTypeChange: (type: PostType) => void;
}> = ({ selectedType, onTypeChange }) => {
  const options = [
    { type: "post" as PostType, label: "Create Post" },
    { type: "campaign-update" as PostType, label: "Campaign Update" },
  ];

  return (
    <div className="flex bg-[#1A1A1A] rounded-[20px] p-2 gap-2">
      {options.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={cn(
            "flex-1 py-3 px-6 rounded-[16px] font-['Poppins'] font-medium",
            "text-[16px] tracking-[0.64px] transition-all duration-200",
            selectedType === type
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

// Create Post Form Component
const CreatePostForm: React.FC<{
  category: string;
  title: string;
  content: string;
  onCategoryChange: (category: string) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onPublish: () => void;
  campaignCategories: string[];
  isPublishing?: boolean;
  mediaActions?: MediaActionsProps;
}> = ({
  category,
  title,
  content,
  onCategoryChange,
  onTitleChange,
  onContentChange,
  onPublish,
  campaignCategories,
  isPublishing = false,
  mediaActions,
}) => {
  return (
    <div className="space-y-6">
      <SelectField
        label="Category"
        value={category}
        onChange={onCategoryChange}
        options={campaignCategories}
        placeholder="Select a category"
        required
      />

      <InputField
        label="Title"
        value={title}
        onChange={onTitleChange}
        placeholder="What's your post about?"
        required
      />

      <TextAreaField
        label="Content"
        value={content}
        onChange={onContentChange}
        placeholder="Share your thoughts..."
        minHeight="272px"
        showMediaActions={true}
        required
        mediaActions={mediaActions}
      />

      <div className="flex justify-end">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={cn(
            "px-8 py-4 rounded-[20px] font-['Poppins'] font-semibold",
            "text-[16px] tracking-[0.64px] transition-all duration-200",
            "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
            "hover:from-purple-700 hover:to-pink-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          )}
        >
          {isPublishing ? "Publishing..." : "Publish Post"}
        </button>
      </div>
    </div>
  );
};

// Create Campaign Update Form Component
const CreateCampaignUpdateForm: React.FC<CreateCampaignUpdateFormProps> = ({
  category,
  campaign,
  title,
  update,
  onCategoryChange,
  onCampaignChange,
  onTitleChange,
  onUpdateChange,
  onPublish,
  campaignCategories,
  userCampaigns,
  isPublishing = false,
  mediaActions,
}) => {
  return (
    <div className="space-y-6">
      <SelectField
        label="Category"
        value={category}
        onChange={onCategoryChange}
        options={campaignCategories}
        placeholder="Select a category"
        required
      />

      <SelectField
        label="Campaign"
        value={campaign}
        onChange={onCampaignChange}
        options={userCampaigns}
        placeholder="Select your campaign"
        required
      />

      <InputField
        label="Update Title"
        value={title}
        onChange={onTitleChange}
        placeholder="What's this update about?"
        required
      />

      <TextAreaField
        label="Update"
        value={update}
        onChange={onUpdateChange}
        placeholder="Share your campaign update..."
        minHeight="188px"
        showMediaActions={true}
        required
        mediaActions={mediaActions}
      />

      <div className="flex justify-end">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={cn(
            "px-8 py-4 rounded-[20px] font-['Poppins'] font-semibold",
            "text-[16px] tracking-[0.64px] transition-all duration-200",
            "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
            "hover:from-purple-700 hover:to-pink-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          )}
        >
          {isPublishing ? "Publishing..." : "Publish Update"}
        </button>
      </div>
    </div>
  );
};

// Error Display Component
const ErrorDisplay: React.FC<{
  errors: PostFormErrors | CampaignUpdateFormErrors;
}> = ({ errors }) => {
  const firstError = getFirstError(errors);

  if (!firstError) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
      <p className="text-red-400 font-['Poppins'] text-sm">{firstError}</p>
    </div>
  );
};

// Main CreatePost Component
const CreatePost: React.FC<CreatePostProps> = ({
  user,
  onPublish,
  campaignCategories = POST_CATEGORIES,
  userCampaigns = MOCK_USER_CAMPAIGNS,
}) => {
  // State management
  const [selectedType, setSelectedType] = useState<PostType>("post");
  const [isPublishing, setIsPublishing] = useState(false);

  // Post form state
  const [postForm, setPostForm] = useState({
    category: "",
    title: "",
    content: "",
  });

  // Campaign update form state
  const [campaignUpdateForm, setCampaignUpdateForm] = useState({
    category: "",
    campaign: "",
    title: "",
    update: "",
  });

  // Form errors
  const [postErrors, setPostErrors] = useState<PostFormErrors>({});
  const [campaignUpdateErrors, setCampaignUpdateErrors] =
    useState<CampaignUpdateFormErrors>({});

  // Media actions handlers
  const mediaActions: MediaActionsProps = useMemo(
    () => ({
      onImageClick: () => console.log("Image clicked"),
      onGifClick: () => console.log("GIF clicked"),
      onPollClick: () => console.log("Poll clicked"),
      onEmojiClick: () => console.log("Emoji clicked"),
      onCalendarClick: () => console.log("Calendar clicked"),
      onLocationClick: () => console.log("Location clicked"),
    }),
    []
  );

  // Post form handlers
  const handlePostCategoryChange = useCallback((category: string) => {
    setPostForm((prev) => ({ ...prev, category }));
    setPostErrors((prev) => ({ ...prev, category: undefined }));
  }, []);

  const handlePostTitleChange = useCallback((title: string) => {
    setPostForm((prev) => ({ ...prev, title }));
    setPostErrors((prev) => ({ ...prev, title: undefined }));
  }, []);

  const handlePostContentChange = useCallback((content: string) => {
    setPostForm((prev) => ({ ...prev, content }));
    setPostErrors((prev) => ({ ...prev, content: undefined }));
  }, []);

  // Campaign update form handlers
  const handleCampaignUpdateCategoryChange = useCallback((category: string) => {
    setCampaignUpdateForm((prev) => ({ ...prev, category }));
    setCampaignUpdateErrors((prev) => ({ ...prev, category: undefined }));
  }, []);

  const handleCampaignUpdateCampaignChange = useCallback((campaign: string) => {
    setCampaignUpdateForm((prev) => ({ ...prev, campaign }));
    setCampaignUpdateErrors((prev) => ({ ...prev, campaign: undefined }));
  }, []);

  const handleCampaignUpdateTitleChange = useCallback((title: string) => {
    setCampaignUpdateForm((prev) => ({ ...prev, title }));
    setCampaignUpdateErrors((prev) => ({ ...prev, title: undefined }));
  }, []);

  const handleCampaignUpdateUpdateChange = useCallback((update: string) => {
    setCampaignUpdateForm((prev) => ({ ...prev, update }));
    setCampaignUpdateErrors((prev) => ({ ...prev, update: undefined }));
  }, []);

  // Publish handlers
  const handlePostPublish = useCallback(async () => {
    const errors = validatePostForm(postForm);
    setPostErrors(errors);

    if (!isFormValid(errors)) {
      return;
    }

    setIsPublishing(true);
    try {
      const publishData: PublishData = {
        type: "post",
        ...postForm,
      };
      await onPublish(publishData);
      
      // Reset form on success
      setPostForm({ category: "", title: "", content: "" });
      setPostErrors({});
    } catch (error) {
      console.error("Failed to publish post:", error);
    } finally {
      setIsPublishing(false);
    }
  }, [postForm, onPublish]);

  const handleCampaignUpdatePublish = useCallback(async () => {
    const errors = validateCampaignUpdateForm(campaignUpdateForm);
    setCampaignUpdateErrors(errors);

    if (!isFormValid(errors)) {
      return;
    }

    setIsPublishing(true);
    try {
      const publishData: PublishData = {
        type: "campaign-update",
        category: campaignUpdateForm.category,
        title: campaignUpdateForm.title,
        campaign: campaignUpdateForm.campaign,
        update: campaignUpdateForm.update,
      };
      await onPublish(publishData);
      
      // Reset form on success
      setCampaignUpdateForm({ category: "", campaign: "", title: "", update: "" });
      setCampaignUpdateErrors({});
    } catch (error) {
      console.error("Failed to publish campaign update:", error);
    } finally {
      setIsPublishing(false);
    }
  }, [campaignUpdateForm, onPublish]);

  return (
    <div className="max-w-2xl mx-auto bg-[#0F0820] rounded-[32px] p-8 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={user.avatar}
            alt={user.username}
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-['Poppins'] font-semibold text-[18px] text-white">
              {user.username}
            </h3>
            <p className="font-['Poppins'] text-[14px] text-white/60">
              Create a new {selectedType === "post" ? "post" : "campaign update"}
            </p>
          </div>
        </div>
        <button
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-white/60" />
        </button>
      </div>

      {/* Post Type Toggle */}
      <div className="mb-8">
        <PostTypeToggle
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </div>

      {/* Error Display */}
      {selectedType === "post" && <ErrorDisplay errors={postErrors} />}
      {selectedType === "campaign-update" && (
        <ErrorDisplay errors={campaignUpdateErrors} />
      )}

      {/* Form Content */}
      {selectedType === "post" ? (
        <CreatePostForm
          category={postForm.category}
          title={postForm.title}
          content={postForm.content}
          onCategoryChange={handlePostCategoryChange}
          onTitleChange={handlePostTitleChange}
          onContentChange={handlePostContentChange}
          onPublish={handlePostPublish}
          campaignCategories={campaignCategories}
          isPublishing={isPublishing}
          mediaActions={mediaActions}
        />
      ) : (
        <CreateCampaignUpdateForm
          category={campaignUpdateForm.category}
          campaign={campaignUpdateForm.campaign}
          title={campaignUpdateForm.title}
          update={campaignUpdateForm.update}
          onCategoryChange={handleCampaignUpdateCategoryChange}
          onCampaignChange={handleCampaignUpdateCampaignChange}
          onTitleChange={handleCampaignUpdateTitleChange}
          onUpdateChange={handleCampaignUpdateUpdateChange}
          onPublish={handleCampaignUpdatePublish}
          campaignCategories={campaignCategories}
          userCampaigns={userCampaigns}
          isPublishing={isPublishing}
          mediaActions={mediaActions}
        />
      )}
    </div>
  );
};

export default CreatePost;