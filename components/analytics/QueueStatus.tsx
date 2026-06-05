import React from 'react'
import { SendVolume } from '@/types/analytics'

interface QueueStatusProps {
  sent: number
  pending: number
  failed: number
  sendVolume?: SendVolume
}

export const QueueStatus: React.FC<QueueStatusProps> = ({ 
  sent, 
  pending, 
  failed,
  sendVolume 
}) => {
  const recentDays = sendVolume?.sendsByDay?.slice(0, 7) || []
  const maxCount = Math.max(...recentDays.map(d => d.count), 1)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Queue Status
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-green-500 text-xs">●</span> Successfully sent
          </div>
          <div className="text-sm font-semibold text-green-600">{sent.toLocaleString()}</div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-amber-500 text-xs">●</span> Queued pending
          </div>
          <div className="text-sm font-semibold text-amber-600">{pending.toLocaleString()}</div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-rose-500 text-xs">●</span> Failed / Risky
          </div>
          <div className={`text-sm font-semibold ${failed > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
            {failed.toLocaleString()}
          </div>
        </div>

        {sendVolume && (
          <div className="pt-4">
            <div className="text-xs font-medium text-gray-500 mb-2">
              Recent activity (last {recentDays.length} days)
            </div>
            <div className="flex items-end gap-1 h-12">
              {recentDays.map((day, idx) => (
                <div
                  key={day.date}
                  className="flex-1 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors relative group"
                  style={{ 
                    height: `${Math.max(4, (day.count / maxCount) * 100)}%`,
                    opacity: idx === 0 ? 1 : 0.6 + (idx * 0.1)
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {day.date}: {day.count} sent
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{recentDays[recentDays.length - 1]?.date}</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {failed === 0 && (
          <div className="mt-4 p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs text-green-800 flex items-center gap-2">
            <span className="text-green-500">✓</span>
            All clear — no risky addresses
          </div>
        )}
      </div>
    </div>
  )
}
