"use client";

const CampaignSendImportantNotes = () => {
  return (
    <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-100 mb-4">
        Important Notes
      </h3>
      <ul className="space-y-2 text-sm text-text-200">
        <li className="flex items-start">
          <span className="text-brand-main mr-2">•</span>
          <span>Tracking pixel will be added automatically</span>
        </li>
        <li className="flex items-start">
          <span className="text-brand-main mr-2">•</span>
          <span>Opens and clicks will be tracked</span>
        </li>
        <li className="flex items-start">
          <span className="text-brand-main mr-2">•</span>
          <span>Bounces and complaints will be monitored</span>
        </li>
        <li className="flex items-start">
          <span className="text-brand-main mr-2">•</span>
          <span>You can pause or stop the campaign anytime</span>
        </li>
      </ul>
    </div>
  );
};

export default CampaignSendImportantNotes;

