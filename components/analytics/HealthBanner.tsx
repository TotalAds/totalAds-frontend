import React from 'react'

interface HealthBannerProps {
  deliveryRate: string
  openRate: string
  openRateMultiplier: string
  pending: number
}

export const HealthBanner: React.FC<HealthBannerProps> = ({
  deliveryRate,
  openRate,
  openRateMultiplier,
  pending,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-xl p-5 mb-6 flex items-start gap-4">
      <div className="text-2xl leading-none">🔥</div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Your campaign is off to a strong start
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium text-gray-900">{deliveryRate}% delivery rate</span> ·{' '}
          <span className="font-medium text-gray-900">{openRate}% open rate</span> ({openRateMultiplier}× the industry average of 21%) ·{' '}
          <span className="font-medium text-gray-900">{pending} emails queued</span> and ready to convert
        </p>
      </div>
    </div>
  )
}
