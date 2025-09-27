import React, { useState } from "react";
import ShareCampaignModal from "./ShareCampaignModal";

// Example usage component for testing
const ShareCampaignTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Open Share Campaign Modal
      </button>

      <ShareCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignUrl="https://www.fundbrave.com/campaign/supportjohnsfightagainscancer"
        campaignTitle="Support John's Fight Against Cancer"
      />
    </div>
  );
};

export default ShareCampaignTest;
