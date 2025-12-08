"use client";

import React, { useState } from "react";
import DesignButton from "../components/common/DesignButton";
import SuccessCard from "../components/ui/SuccessCard";
import AddReminderModal from "../components/ui/AddReminderModal";
import ShareCampaignModal from "../components/ui/ShareCampaignModal";
import { CreatePost } from "../components/ui";
import ExampleUsage from "../components/ui/CreatePost/CreatePostExample";
import type { PublishData } from "../components/ui/types/CreatePost.types";

const ThemePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleProviderSelect = (provider: string) => {
    console.log("Selected provider:", provider);
    setIsModalOpen(false);
    // Here you would typically handle the provider selection
  };

  const handlePublish = (data: PublishData) => {
    console.log("Published data:", data);
    // Here you would typically send the data to your API
    // For example:
    // if (data.type === 'post') {
    //   await createPost(data.content);
    // } else if (data.type === 'campaign-update') {
    //   await createCampaignUpdate(data);
    // }
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <section className="py-12 md:py-16">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark dark:text-white mb-6 font-gilgan">
            Welcome to FundBrave
          </h1>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-primary-800 dark:text-purple-300 mb-4 font-montserrat">
              A Decentralized Fundraising Platform
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              FundBrave connects innovators and supporters in a transparent,
              secure environment powered by blockchain technology. Start your
              journey in web3 fundraising today.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-md transition-colors font-medium">
                Start a Campaign
              </button>
              <button className="bg-soft-purple-100 hover:bg-soft-purple-200 text-primary-800 px-6 py-3 rounded-md transition-colors font-medium border border-soft-purple-200 dark:bg-primary-900 dark:hover:bg-primary-800 dark:text-white dark:border-primary-700">
                Explore Projects
              </button>
            </div>
          </div>
        </section>
        <section className="py-10">
          {/* Color Theme Showcase */}
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            FundBrave Theme Colors
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Blue Colors */}
            <div className="p-6 rounded-lg bg-transparent dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-blue">
                Primary Blue
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-primary-50"></div>
                <div className="h-12 rounded bg-primary-200"></div>
                <div className="h-12 rounded bg-primary-400"></div>
                <div className="h-12 rounded bg-primary-600"></div>
                <div className="h-12 rounded bg-primary-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our primary blue color represents trust and innovation.
              </p>
              <button className="mt-4 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded transition-colors w-full">
                Primary Action
              </button>
            </div>

            {/* Primary Purple Colors */}
            <div className="p-6 rounded-lg bg-transparent dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-purple">
                Primary Purple
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-purple-50"></div>
                <div className="h-12 rounded bg-purple-200"></div>
                <div className="h-12 rounded bg-purple-400"></div>
                <div className="h-12 rounded bg-purple-600"></div>
                <div className="h-12 rounded bg-purple-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our purple palette adds creativity to our brand.
              </p>
              <button className="mt-4 bg-purple hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors w-full">
                Purple Action
              </button>
            </div>

            {/* Soft Purple Colors */}
            <div className="p-6 rounded-lg bg-white dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-soft-purple">
                Soft Purple
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-soft-purple-50"></div>
                <div className="h-12 rounded bg-soft-purple-200"></div>
                <div className="h-12 rounded bg-soft-purple-400"></div>
                <div className="h-12 rounded bg-soft-purple-600"></div>
                <div className="h-12 rounded bg-soft-purple-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our soft purple adds a gentle feel to our interfaces.
              </p>
              <button className="mt-4 bg-soft-purple hover:bg-soft-purple-600 text-soft-purple-foreground px-4 py-2 rounded transition-colors w-full">
                Soft Action
              </button>
            </div>
          </div>
        </section>
        {/* custom button component */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-brand-dark dark:text-white border-b border-border pb-2">
            Design Button Component
          </h2>

          <div className=" grid gap-4 grid-cols-3">
            <DesignButton variant="primary" size="small" fullWidth={false}>
              Primary
            </DesignButton>
            <DesignButton variant="secondary" size="small" fullWidth={false}>
              Secondary
            </DesignButton>
            <DesignButton variant="tertiary" size="small" fullWidth={false}>
              Tertiary
            </DesignButton>

            <DesignButton variant="primary" size="medium" fullWidth={false}>
              Medium Primary
            </DesignButton>
            <DesignButton variant="secondary" size="medium" fullWidth={false}>
              Medium Secondary
            </DesignButton>
            <DesignButton variant="tertiary" size="medium" fullWidth={false}>
              Medium Tertiary
            </DesignButton>

            <DesignButton variant="primary" size="big" fullWidth={false}>
              Big Primary
            </DesignButton>
            <DesignButton variant="secondary" size="big" fullWidth={false}>
              Big Secondary
            </DesignButton>
            <DesignButton variant="tertiary" size="big" fullWidth={false}>
              Big Tertiary
            </DesignButton>

            <DesignButton variant="primary" size="large" fullWidth>
              Full Width Primary
            </DesignButton>
            <DesignButton variant="secondary" size="large" fullWidth>
              Full Width Secondary
            </DesignButton>
            <DesignButton variant="tertiary" size="large" fullWidth>
              Full Width Tertiary
            </DesignButton>
          </div>
        </section>
        {/* Success Card Component */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            Success Card Component
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Default Success Card - Animated */}
            <div className="flex justify-center">
              <SuccessCard showAnimation={true} />
            </div>

            {/* Custom Success Card - Transaction */}
            <div className="flex justify-center">
              <SuccessCard
                title="Transaction Complete!"
                message="Your donation of 50 ETH to the Climate Change Initiative has been successfully processed."
                buttonText="View Transaction"
                onButtonClick={() => console.log("View transaction clicked")}
                showAnimation={false}
              />
            </div>

            {/* Custom Success Card - Campaign Created */}
            <div className="flex justify-center">
              <SuccessCard
                title="Campaign Created!"
                message="Your fundraising campaign 'Save the Ocean' has been successfully created and is now live."
                buttonText="View Campaign"
                onButtonClick={() => console.log("View campaign clicked")}
                showAnimation={false}
              />
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
              Success Card Features
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Animated success confirmation with checkmark</li>
              <li>Customizable title and message</li>
              <li>Optional action button with callback</li>
              <li>Responsive design for all screen sizes</li>
              <li>Dark mode support</li>
            </ul>
          </div>
        </section>
        {/* Add Reminder Modal Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                Modal Features
              </h3>

              <DesignButton
                variant="primary"
                size="medium"
                onClick={() => setIsModalOpen(true)}
              >
                Open Add Reminder Modal
              </DesignButton>
            </div>
          </div>
        </section>

        {/* CreatePost Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                CreatePost Popup Component
              </h3>
              <p className="text-muted-foreground dark:text-purple-100 mb-4">
                Interactive popup for creating posts and campaign updates with
                tabbed interface and media actions.
              </p>

              <DesignButton
                variant="primary"
                size="medium"
                onClick={() => setIsCreatePostOpen(true)}
              >
                Open CreatePost Popup
              </DesignButton>
            </div>
          </div>
        </section>

        {/* ShareCampaignModal Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                Share Campaign Modal Component
              </h3>
              <p className="text-muted-foreground dark:text-purple-100 mb-4">
                Modal for sharing campaigns across social media platforms and
                communities with customizable sharing options.
              </p>

              <DesignButton
                variant="primary"
                size="medium"
                onClick={() => setIsShareModalOpen(true)}
              >
                Open Share Campaign Modal
              </DesignButton>
            </div>
          </div>
        </section>

        {/* Theme toggle information */}
        <section className="mt-10 p-6 rounded-lg bg-accent dark:bg-primary-800 text-accent-foreground border border-border">
          <h2 className="text-xl font-semibold mb-4">Theme Support</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <h3 className="text-lg mb-2 font-medium">Light & Dark Mode</h3>
              <p className="text-muted-foreground dark:text-purple-100">
                This platform supports both light and dark themes. Click the
                theme toggle in the navbar to switch between themes or use your
                system preferences.
              </p>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg mb-2 font-medium">Brand Colors</h3>
              <p className="text-muted-foreground dark:text-purple-100">
                Our color system is designed to support fundraisers and donors
                in web3, building emotional connection, readability, and a sense
                of belonging across the platform.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <ExampleUsage />
        </section>
      </main>

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProviderSelect={handleProviderSelect}
      />

      {/* CreatePost Popup */}
      <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPublish={handlePublish}
      />

      {/* ShareCampaignModal */}
      <ShareCampaignModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignUrl="https://www.fundbrave.com/campaign/supportjohnsfightagainscancer"
        campaignTitle="Support John's Fight Against Cancer"
      />
    </>
  );
};

export default ThemePage;
