import React from 'react'

interface OptimizationInsightsProps {
  mode: 'sequence' | 'single'
  openRate: number
  clickRate: number
  replied: number
  sent: number
}

export const OptimizationInsights: React.FC<OptimizationInsightsProps> = ({
  mode,
  openRate,
  clickRate,
  replied,
  sent,
}) => {
  const insights: string[] = []

  if (openRate >= 30) {
    insights.push('Subject line performance is strong and cutting through inbox noise.')
  } else if (openRate > 0) {
    insights.push('Open rate is moderate; test tighter subject hooks and send windows.')
  } else {
    insights.push('No opens yet; engagement usually appears within the first few hours.')
  }

  if (clickRate === 0 && sent > 0) {
    insights.push('Add a clearer value CTA in the next message to lift click intent.')
  } else if (clickRate > 0) {
    insights.push('Clicks are converting; keep message-to-offer alignment consistent.')
  }

  if (mode === 'sequence' && replied === 0 && sent > 0) {
    insights.push('Reply gap is your main optimization lever: refine follow-up positioning.')
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Actionable insights</h3>
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
