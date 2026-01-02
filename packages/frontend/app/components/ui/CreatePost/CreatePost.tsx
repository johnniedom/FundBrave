"use client";

import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { X, ChevronDown } from "@/app/components/ui/icons";
import { Button } from "../button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ModalBackdrop from "../../common/ModalBackdrop";

// Import form components
import { SelectField, InputField, TextAreaField } from "../form/FormFields";
import TabNavigation from "../TabNavigation";
// Imports from separated files
import type {
  UserProfile,
  CreatePostProps,
  MediaActionsProps,
  CreateCampaignUpdateFormProps,
  CreatePostFormProps,
} from "../types/CreatePost.types";

import {
  DEFAULT_USER,
  DEFAULT_CAMPAIGN_CATEGORIES,
  DEFAULT_USER_CAMPAIGNS,
  FORM_DIMENSIONS,
} from "../constants/CreatePost.constants";

import { useCreatePost } from "../hooks/useCreatePost";
import {
  validatePostForm,
  validateCampaignUpdateForm,
  isFormValid,
} from "../../../../lib/validation.utils";

/**
 * Create Post/Campaign Update Popup Component
 *
 * A modal dialog that allows users to create either a general post or a campaign update.
 * Features two distinct modes with different form fields and functionality.
 */

// User Profile Component
interface UserProfileHeaderProps {
  user: UserProfile;
  onAudienceClick?: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  onAudienceClick,
}) => (
  <div className="flex items-center gap-2 pr-8">
    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full overflow-hidden flex-shrink-0">
      <Image
        src={user.avatar}
        alt={user.name}
        height={100}
        width={100}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="font-['Poppins'] font-medium text-[12px] sm:text-[14px] text-white tracking-[0.24px] truncate">
        {user.name}
      </div>
      <button
        onClick={onAudienceClick}
        className="flex items-center gap-0.5 hover:text-white/80 transition-colors w-fit"
      >
        <span className="font-['Poppins'] text-[10px] sm:text-[12px] text-white/60 tracking-[0.48px]">
          {user.audience}
        </span>
        <ChevronDown size={14} className="text-white/60 flex-shrink-0" />
      </button>
    </div>
  </div>
);

// Form Validation
const CreatePostForm: React.FC<CreatePostFormProps> = ({
  content,
  onContentChange,
  onRewriteWithAI,
  onPublish,
  isPublishing = false,
  mediaActions,
}) => {
  const errors = validatePostForm(content);
  const isValid = isFormValid(errors);

  return (
    <div className={cn("flex flex-col gap-7", "w-full max-w-[559px]")}>
      <TextAreaField
        value={content}
        onChange={onContentChange}
        label="Content"
        placeholder="What do you want to talk about?"
        minHeight={FORM_DIMENSIONS.DEFAULT_TEXTAREA_HEIGHT}
        mediaActions={mediaActions}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="secondary"
          size="md"
          onClick={onRewriteWithAI}
          className="flex-1 w-full"
          disabled={isPublishing}
        >
          Rewrite with AI
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onPublish}
          className="flex-1 w-full"
          disabled={!isValid || isPublishing}
          loading={isPublishing}
          loadingText="Publishing..."
        >
          Publish
        </Button>
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
  const errors = validateCampaignUpdateForm({
    category,
    campaign,
    title,
    update,
  });
  const isValid = isFormValid(errors);

  const updatePlaceholder = campaign
    ? `What's the update on ${campaign}?`
    : "What's the update?";

  return (
    <div className={cn("flex flex-col gap-7", "w-full max-w-[554px]")}>
      <div className="flex flex-col gap-4">
        <SelectField
          label="Campaign Category"
          value={category}
          onChange={onCategoryChange}
          options={campaignCategories}
          placeholder="Select category"
          required
        />

        <SelectField
          label="Campaign"
          value={campaign}
          onChange={onCampaignChange}
          options={userCampaigns}
          placeholder="Select campaign"
          required
        />

        <InputField
          label="Title"
          value={title}
          onChange={onTitleChange}
          placeholder="Update title"
          required
        />

        <TextAreaField
          label="Update"
          value={update}
          onChange={onUpdateChange}
          placeholder={updatePlaceholder}
          minHeight={FORM_DIMENSIONS.CAMPAIGN_UPDATE_TEXTAREA_HEIGHT}
          required
          mediaActions={mediaActions}
        />
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={onPublish}
        fullWidth
        disabled={!isValid || isPublishing}
        loading={isPublishing}
        loadingText="Publishing..."
      >
        Publish
      </Button>
    </div>
  );
};

// Custom Hooks
const CreatePost: React.FC<CreatePostProps> = ({
  isOpen,
  onClose,
  onPublish,
  user = DEFAULT_USER,
  campaignCategories = DEFAULT_CAMPAIGN_CATEGORIES,
  userCampaigns = DEFAULT_USER_CAMPAIGNS,
}) => {
  const {
    activeTab,
    setActiveTab,
    isPublishing,
    postContent,
    setPostContent,
    campaignCategory,
    setCampaignCategory,
    selectedCampaign,
    setSelectedCampaign,
    campaignTitle,
    setCampaignTitle,
    campaignUpdate,
    setCampaignUpdate,
    handlePublish,
    handleRewriteWithAI,
  } = useCreatePost(onPublish, onClose);

  // GSAP refs
  const closeRef = useRef<SVGSVGElement>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(closeRef.current);
    };
  }, []);

  // Close button hover animations
  const handleCloseHover = useCallback(() => {
    if (!closeRef.current) return;
    gsap.to(closeRef.current, {
      rotation: 90,
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  const handleCloseLeave = useCallback(() => {
    if (!closeRef.current) return;
    gsap.to(closeRef.current, {
      rotation: 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  // Media action handlers - implement based on your requirements
  const mediaActions: MediaActionsProps = {
    onImageClick: () => console.log("Image clicked"),
    onGifClick: () => console.log("GIF clicked"),
    onPollClick: () => console.log("Poll clicked"),
    onEmojiClick: () => console.log("Emoji clicked"),
    onCalendarClick: () => console.log("Calendar clicked"),
    onLocationClick: () => console.log("Location clicked"),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <ModalBackdrop onClose={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-[#09011A] rounded-[20px] w-full",
          "max-w-[360px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px]",
          "max-h-[90vh] overflow-hidden"
        )}
      >
        {/* Header */}
        <div className={cn("relative pb-0", "p-4 sm:p-6 lg:p-[37px]")}>
          {/* Close Button */}
          <button
            onClick={onClose}
            onMouseEnter={handleCloseHover}
            onMouseLeave={handleCloseLeave}
            aria-label="Close modal"
            type="button"
            className={cn(
              "absolute flex items-center justify-center w-8 h-8",
              "text-white/60 hover:text-white transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
              "rounded-full hover:bg-white/10",
              "top-4 right-4 sm:top-6 sm:right-6 lg:top-[37px] lg:right-[37px]"
            )}
          >
            <X ref={closeRef} size={16} />
          </button>

          <UserProfileHeader user={user} />
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div
          className={cn(
            "pb-4 sm:pb-6 lg:pb-[37px] overflow-y-auto",
            "px-4 sm:px-8 md:px-16 lg:px-24 xl:px-[142px]",
            "max-h-[calc(90vh-240px)]",
            "flex justify-center"
          )}
        >
          {activeTab === "post" ? (
            <CreatePostForm
              content={postContent}
              onContentChange={setPostContent}
              onRewriteWithAI={handleRewriteWithAI}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              mediaActions={mediaActions}
            />
          ) : (
            <CreateCampaignUpdateForm
              category={campaignCategory}
              campaign={selectedCampaign}
              title={campaignTitle}
              update={campaignUpdate}
              onCategoryChange={setCampaignCategory}
              onCampaignChange={setSelectedCampaign}
              onTitleChange={setCampaignTitle}
              onUpdateChange={setCampaignUpdate}
              onPublish={handlePublish}
              campaignCategories={campaignCategories}
              userCampaigns={userCampaigns}
              isPublishing={isPublishing}
              mediaActions={mediaActions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
