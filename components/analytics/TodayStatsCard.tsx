import React from 'react'

interface TodayStatsCardProps {
  sentToday: number
  blockedToday: number
  verifiedToday: number
}

export const TodayStatsCard: React.FC<TodayStatsCardProps> = ({
  sentToday,
  blockedToday,
  verifiedToday,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Today&apos;s Activity
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-green-500">✓</span> Sent today
          </div>
          <div className="text-sm font-semibold text-green-600">{sentToday.toLocaleString()}</div>
        </div>

        {verifiedToday > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-blue-500">✓</span> Verified today
            </div>
            <div className="text-sm font-semibold text-blue-600">{verifiedToday.toLocaleString()}</div>
          </div>
        )}

        {blockedToday > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-amber-500">⚠</span> Blocked (verification)
            </div>
            <div className="text-sm font-semibold text-amber-600">{blockedToday.toLocaleString()}</div>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-400">
          Based on UTC calendar day
        </div>
      </div>
    </div>
  )
}
