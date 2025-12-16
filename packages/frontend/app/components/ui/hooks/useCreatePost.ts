/**
 * Custom hooks for CreatePost component
 */

import { useState, useCallback } from "react";
import type { PostType, PublishData } from "../types/CreatePost.types";

export const useCreatePost = (
  onPublish: (data: PublishData) => void,
  onClose: () => void
) => {
  const [activeTab, setActiveTab] = useState<PostType>("post");
  const [isPublishing, setIsPublishing] = useState(false);

  // Post form state
  const [postContent, setPostContent] = useState("");

  // Campaign update form state
  const [campaignCategory, setCampaignCategory] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignUpdate, setCampaignUpdate] = useState("");

  const resetForm = useCallback(() => {
    setPostContent("");
    setCampaignCategory("");
    setSelectedCampaign("");
    setCampaignTitle("");
    setCampaignUpdate("");
    setIsPublishing(false);
  }, []);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);

    try {
      const data: PublishData =
        activeTab === "post"
          ? { type: "post", content: postContent }
          : {
              type: "campaign-update",
              category: campaignCategory,
              campaign: selectedCampaign,
              title: campaignTitle,
              update: campaignUpdate,
            };

      await onPublish(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to publish:", error);
      setIsPublishing(false);
    }
  }, [
    activeTab,
    postContent,
    campaignCategory,
    selectedCampaign,
    campaignTitle,
    campaignUpdate,
    onPublish,
    onClose,
    resetForm,
  ]);

  const handleRewriteWithAI = useCallback(() => {
    // AI rewrite functionality - implement based on your AI service
    console.log("Rewrite with AI clicked");
  }, []);

  return {
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
    resetForm,
  };
};
