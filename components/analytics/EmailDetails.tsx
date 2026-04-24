import React from 'react'

interface EmailDetailsProps {
  campaign: {
    subject?: string
    sender: string
    fromEmail: string
    replyTo?: string
    previewText?: string
    startedAt: string
    sentEmails: number
    totalEmails: number
  }
  metrics: {
    pending: number
  }
}

export const EmailDetails: React.FC<EmailDetailsProps> = ({ campaign, metrics }) => {
  return (
    <div className="mb-8">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
        1 email · {campaign.sentEmails} sent · {metrics.pending} pending
      </div>
      
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Subject Line</div>
              <div className="text-sm font-medium text-gray-900">{campaign.subject || 'No subject available'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Preview Text</div>
              <div className="text-sm text-gray-600">
                {campaign.previewText || 'No preview text captured for this campaign'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">From Name</div>
              <div className="text-sm font-medium text-gray-900">{campaign.sender}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Reply-To</div>
              <div className="text-sm text-gray-600">{campaign.replyTo || campaign.fromEmail}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Send Time</div>
              <div className="text-sm text-gray-600">{campaign.startedAt}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
