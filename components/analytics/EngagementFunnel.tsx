import React from 'react'

interface EngagementFunnelProps {
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    replied: number
    bounced?: number
    complained?: number
    unsubscribed?: number
    failed?: number
  }
}

interface FunnelStepProps {
  label: string
  value: number
  rate: number
  color: string
  isNegative?: boolean
}

const FunnelStep: React.FC<FunnelStepProps> = ({ label, value, rate, color, isNegative }) => {
  return (
    <div className="flex-1 flex flex-col items-center text-center">
      <div className="h-12 flex items-end justify-center mb-2 w-full">
        <div
          className={`w-8 rounded-t ${color} transition-all duration-500 ${isNegative ? 'rounded-b' : ''}`}
          style={{
            height: `${Math.max(4, (rate / 100) * 48)}px`,
            opacity: value > 0 ? 1 : 0.3,
          }}
        />
      </div>
      <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${isNegative ? 'text-rose-500' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className="text-base font-semibold text-gray-900 leading-none mb-1">
        {value.toLocaleString()}
      </div>
      <div className={`text-xs ${isNegative ? 'text-rose-500' : 'text-gray-400'}`}>
        {rate.toFixed(1)}%
      </div>
    </div>
  )
}

export const EngagementFunnel: React.FC<EngagementFunnelProps> = ({ metrics }) => {
  const { 
    sent, 
    delivered, 
    opened, 
    clicked, 
    replied, 
    bounced = 0, 
    complained = 0, 
    unsubscribed = 0,
    failed = 0 
  } = metrics

  const getPercent = (val: number, base: number = sent) => (base > 0 ? (val / base) * 100 : 0)

  // Positive engagement steps
  const positiveSteps = [
    { label: 'Sent', value: sent, rate: getPercent(sent), color: 'bg-blue-500' },
    { label: 'Delivered', value: delivered, rate: getPercent(delivered), color: 'bg-green-500' },
    { label: 'Opened', value: opened, rate: getPercent(opened), color: 'bg-amber-500' },
    { label: 'Clicked', value: clicked, rate: getPercent(clicked, opened || 1), color: 'bg-purple-500' },
    { label: 'Replied', value: replied, rate: getPercent(replied, opened || 1), color: 'bg-indigo-500' },
  ]

  // Negative engagement (drop-offs)
  const hasNegativeMetrics = bounced > 0 || complained > 0 || unsubscribed > 0 || failed > 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Engagement Funnel
      </h3>
      
      {/* Positive Flow */}
      <div className="flex items-center justify-between mb-8">
        {positiveSteps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <FunnelStep {...step} />
            {idx < positiveSteps.length - 1 && (
              <div className="text-gray-300 text-lg -mt-6 mx-1">›</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Negative Metrics (Drop-offs) */}
      {hasNegativeMetrics && (
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Where leads dropped off
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bounced > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-medium text-rose-700">Bounced</span>
                </div>
                <div className="text-lg font-semibold text-rose-900">{bounced.toLocaleString()}</div>
                <div className="text-xs text-rose-600">{getPercent(bounced).toFixed(1)}% of sent</div>
              </div>
            )}

            {failed > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-xs font-medium text-orange-700">Failed</span>
                </div>
                <div className="text-lg font-semibold text-orange-900">{failed.toLocaleString()}</div>
                <div className="text-xs text-orange-600">{getPercent(failed).toFixed(1)}% of sent</div>
              </div>
            )}

            {complained > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-xs font-medium text-red-700">Complaints</span>
                </div>
                <div className="text-lg font-semibold text-red-900">{complained.toLocaleString()}</div>
                <div className="text-xs text-red-600">{getPercent(complained, delivered || 1).toFixed(1)}% of delivered</div>
              </div>
            )}

            {unsubscribed > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  <span className="text-xs font-medium text-gray-700">Unsubscribed</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{unsubscribed.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{getPercent(unsubscribed, delivered || 1).toFixed(1)}% of delivered</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-50 mt-6">
        {hasNegativeMetrics 
          ? "Monitor bounce and complaint rates to maintain sender reputation"
          : "Drop-off from Opened → Replied is where your next optimization lives"
        }
      </div>
    </div>
  )
}
