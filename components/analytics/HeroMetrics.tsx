import React from 'react'

interface HeroMetricsProps {
  openRate: string
  openRateMultiplier: string
  deliveryRate: string
  clickRate: string
  pending: number
  sent: number
  delivered: number
}

export const HeroMetrics: React.FC<HeroMetricsProps> = ({
  openRate,
  openRateMultiplier,
  deliveryRate,
  clickRate,
  pending,
  sent,
  delivered,
}) => {
  const oRate = parseFloat(openRate)
  const dRate = parseFloat(deliveryRate)
  const cRate = parseFloat(clickRate)

  const openColor = oRate > 30 ? 'text-green-500' : oRate >= 10 ? 'text-amber-500' : 'text-gray-400'
  const openBorder = oRate > 30 ? 'bg-green-500' : oRate >= 10 ? 'bg-amber-500' : 'bg-gray-200'

  const deliveryColor = dRate === 100 ? 'text-blue-600' : dRate >= 95 ? 'text-amber-500' : 'text-red-500'
  const deliveryBorder = dRate === 100 ? 'bg-blue-600' : dRate >= 95 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Open Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">Open Rate</div>
          <div className={`text-3xl font-semibold leading-none mb-2 ${openColor}`}>
            {oRate > 0 ? `${openRate}%` : '0%'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {oRate > 0 ? (
            <span className="text-gray-500">↑ {openRateMultiplier}× industry avg</span>
          ) : (
            'Emails delivered — opens usually roll in within 1–4 hours'
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${openBorder}`}
          style={{ width: `${Math.min(oRate, 100)}%` }}
        />
      </div>

      {/* Delivery Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">Delivery Rate</div>
          <div className={`text-3xl font-semibold leading-none mb-2 ${deliveryColor}`}>
            {dRate > 0 ? `${deliveryRate}%` : '0%'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {dRate === 100 ? (
            <span className="text-green-600 font-medium">Perfect deliverability ✓</span>
          ) : (
            `${delivered} of ${sent} delivered`
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${deliveryBorder}`}
          style={{ width: `${Math.min(dRate, 100)}%` }}
        />
      </div>

      {/* Click Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">Click-to-open rate</div>
          <div className={`text-3xl font-semibold leading-none mb-2 ${cRate > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
            {cRate > 0 ? `${clickRate}%` : '—'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {cRate > 0 ? 'Clicks are converting' : 'Clicks start rolling in soon'}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${cRate > 0 ? 'bg-purple-600' : 'bg-gray-200'}`}
          style={{ width: `${Math.min(cRate, 100)}%` }}
        />
      </div>

      {/* Leads Queued */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">Leads Queued</div>
          <div className="text-3xl font-semibold leading-none mb-2 text-amber-500">
            {pending}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Primed for next-step delivery
        </div>
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-amber-500"
          style={{ width: pending > 0 ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
