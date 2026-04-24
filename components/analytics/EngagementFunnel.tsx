import React from 'react'

interface EngagementFunnelProps {
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    replied: number
  }
}

export const EngagementFunnel: React.FC<EngagementFunnelProps> = ({ metrics }) => {
  const { sent, delivered, opened, clicked, replied } = metrics

  const getPercent = (val: number) => (sent > 0 ? Math.round((val / sent) * 100) : 0)

  const steps = [
    { label: 'Sent', value: sent, rate: getPercent(sent), color: 'bg-blue-600' },
    { label: 'Delivered', value: delivered, rate: getPercent(delivered), color: 'bg-green-500' },
    { label: 'Opened', value: opened, rate: getPercent(opened), color: 'bg-amber-500' },
    { label: 'Clicked', value: clicked, rate: getPercent(clicked), color: 'bg-purple-500' },
    { label: 'Replied', value: replied, rate: getPercent(replied), color: 'bg-indigo-500' },
  ]

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-6">Engagement funnel — where your leads are</h3>
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="h-9 flex items-end justify-center mb-3 w-full">
                <div
                  className={`w-7 rounded-t-sm ${step.color} transition-all duration-500`}
                  style={{
                    height: `${Math.max(3, (step.rate / 100) * 36)}px`,
                    opacity: step.value > 0 ? 1 : 0.3,
                  }}
                />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                {step.label}
              </div>
              <div className="text-lg font-medium text-gray-900 leading-none mb-1">
                {step.value}
              </div>
              <div className="text-xs text-gray-400">{step.rate}%</div>
            </div>
            {idx < steps.length - 1 && (
              <div className="text-gray-300 text-lg -mt-10">›</div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-50">
        Drop-off from Opened → Replied is where your next optimization lives
      </div>
    </div>
  )
}
