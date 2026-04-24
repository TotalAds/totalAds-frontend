import React from 'react'

interface CampaignInfoProps {
  campaign: {
    sender: string
    fromEmail: string
    createdAt: string
    startedAt: string
  }
}

export const CampaignInfo: React.FC<CampaignInfoProps> = ({ campaign }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Campaign info</h3>

      <div className="flex-1 space-y-4 text-xs">
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">Sender</span>
          <span className="font-medium text-gray-900">{campaign.sender}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">From</span>
          <span className="font-medium text-gray-900">{campaign.fromEmail}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">Created</span>
          <span className="font-medium text-gray-900">{campaign.createdAt}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-gray-500">Started</span>
          <span className="font-medium text-gray-900">{campaign.startedAt}</span>
        </div>
      </div>
    </div>
  )
}
