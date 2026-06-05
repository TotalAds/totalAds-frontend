import React from 'react'

interface HeroMetricsProps {
  openRate: string
  openRateMultiplier: string
  deliveryRate: string
  clickRate: string
  replyRate: string
  pending: number
  sent: number
  delivered: number
  replied: number
}

export const HeroMetrics: React.FC<HeroMetricsProps> = ({
  openRate,
  openRateMultiplier,
  deliveryRate,
  clickRate,
  replyRate,
  pending,
  sent,
  delivered,
  replied,
}) => {
  const oRate = parseFloat(openRate)
  const dRate = parseFloat(deliveryRate)
  const cRate = parseFloat(clickRate)
  const rRate = parseFloat(replyRate)

  const openColor = oRate > 30 ? 'text-green-600' : oRate >= 10 ? 'text-amber-600' : 'text-gray-500'
  const openBorder = oRate > 30 ? 'bg-green-500' : oRate >= 10 ? 'bg-amber-500' : 'bg-gray-300'

  const deliveryColor = dRate === 100 ? 'text-blue-600' : dRate >= 95 ? 'text-blue-600' : dRate >= 90 ? 'text-amber-600' : 'text-rose-600'
  const deliveryBorder = dRate === 100 ? 'bg-blue-600' : dRate >= 95 ? 'bg-blue-500' : dRate >= 90 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      {/* Open Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">Open Rate</div>
          <div className={`text-3xl font-bold leading-none mb-2 ${openColor}`}>
            {oRate > 0 ? `${openRate}%` : '0%'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {oRate > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-green-600">↑</span>
              <span className="text-gray-500">{openRateMultiplier}× industry avg</span>
            </span>
          ) : (
            'Emails delivered — opens roll in within 1-4 hours'
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-1 ${openBorder}`}
          style={{ width: `${Math.min(oRate, 100)}%` }}
        />
      </div>

      {/* Delivery Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">Delivery Rate</div>
          <div className={`text-3xl font-bold leading-none mb-2 ${deliveryColor}`}>
            {dRate > 0 ? `${deliveryRate}%` : '0%'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {dRate >= 98 ? (
            <span className="inline-flex items-center gap-1 text-green-600">
              <span>✓</span> Excellent deliverability
            </span>
          ) : (
            `${delivered.toLocaleString()} of ${sent.toLocaleString()} delivered`
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-1 ${deliveryBorder}`}
          style={{ width: `${Math.min(dRate, 100)}%` }}
        />
      </div>

      {/* Click Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">Click-to-Open</div>
          <div className={`text-3xl font-bold leading-none mb-2 ${cRate > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
            {cRate > 0 ? `${clickRate}%` : '—'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {cRate > 0 ? 'Clicks are converting' : 'Clicks start rolling in soon'}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-1 ${cRate > 0 ? 'bg-purple-600' : 'bg-gray-200'}`}
          style={{ width: `${Math.min(cRate, 100)}%` }}
        />
      </div>

      {/* Reply Rate */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">Reply Rate</div>
          <div className={`text-3xl font-bold leading-none mb-2 ${rRate > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
            {rRate > 0 ? `${replyRate}%` : '—'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {replied > 0 ? (
            <span className="text-indigo-600">{replied.toLocaleString()} replies received</span>
          ) : (
            'No replies yet — follow-ups increase responses'
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 h-1 ${rRate > 0 ? 'bg-indigo-600' : 'bg-gray-200'}`}
          style={{ width: `${Math.min(rRate, 100)}%` }}
        />
      </div>

      {/* Leads Queued */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">Leads Queued</div>
          <div className="text-3xl font-bold leading-none mb-2 text-amber-500">
            {pending.toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {pending > 0 ? 'Primed for next-step delivery' : 'All emails processed'}
        </div>
        <div
          className="absolute bottom-0 left-0 h-1 bg-amber-500"
          style={{ width: pending > 0 ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
