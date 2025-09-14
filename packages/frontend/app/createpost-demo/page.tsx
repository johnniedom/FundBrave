"use client";

import React from "react";
import CreatePost from "../components/CreatePost";
import type { UserProfile, PublishData } from "../components/types/CreatePost.types";

const CreatePostDemo: React.FC = () => {
  // Mock user data
  const mockUser: UserProfile = {
    id: "1",
    username: "John Doe",
    avatar: "/api/placeholder/48/48", // placeholder avatar
  };

  // Mock categories
  const mockCategories = [
    "Technology",
    "Arts & Crafts",
    "Community", 
    "Education",
    "Environment",
    "Health",
    "Social Impact",
    "Innovation",
  ];

  // Mock user campaigns
  const mockCampaigns = [
    "Save the Ocean Campaign",
    "Tech for All Initiative", 
    "Green Energy Project",
    "Education Access Fund",
  ];

  // Mock publish handler
  const handlePublish = async (data: PublishData) => {
    console.log("Publishing data:", data);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show success message
    alert(`${data.type === "post" ? "Post" : "Campaign Update"} published successfully!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">CreatePost Component Demo</h1>
          <p className="text-lg text-white/80">
            Interactive demo of the CreatePost component with form validation and media actions
          </p>
        </div>
        
        <CreatePost
          user={mockUser}
          onPublish={handlePublish}
          campaignCategories={mockCategories}
          userCampaigns={mockCampaigns}
        />
        
        <div className="mt-8 text-center">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-4">Features Demonstrated</h2>
            <ul className="text-white/80 space-y-2">
              <li>✅ Post type toggle (Post vs Campaign Update)</li>
              <li>✅ Form validation with Zod schemas</li>
              <li>✅ Reusable form field components</li>
              <li>✅ Media action buttons</li>
              <li>✅ Error handling and display</li>
              <li>✅ TypeScript type safety</li>
              <li>✅ Responsive design with Tailwind CSS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostDemo;