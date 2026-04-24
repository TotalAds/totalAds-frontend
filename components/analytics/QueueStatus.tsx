import React from 'react'

interface QueueStatusProps {
  sent: number
  pending: number
  failed: number
}

export const QueueStatus: React.FC<QueueStatusProps> = ({ sent, pending, failed }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Email queue status</h3>

      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-green-500">✓</span> Sending today
          </div>
          <div className="text-xs font-medium text-green-600">{sent} sent</div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-amber-500">⏳</span> Queued for next email
          </div>
          <div className="text-xs font-medium text-amber-600">{pending} warm leads</div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={failed > 0 ? 'text-red-500' : 'text-gray-400'}>✗</span> Risky addresses
          </div>
          <div className={`text-xs font-medium ${failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {failed}
          </div>
        </div>
      </div>

      {failed === 0 && (
        <div className="mt-4 p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs text-green-800">
          All clear — no risky addresses
        </div>
      )}
    </div>
  )
}
