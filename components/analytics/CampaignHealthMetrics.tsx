import React from 'react'
import { CampaignRates } from '@/types/analytics'
import {
  DELIVERABILITY_MIN_SAMPLE_WARN,
  getBounceMetricStatus,
} from '@/lib/deliverabilitySafeguards'

interface CampaignHealthMetricsProps {
  rates?: CampaignRates
  metrics: {
    sent: number
    delivered: number
    bounced: number
    complained: number
    unsubscribed: number
    failed: number
  }
}

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  status: 'good' | 'warning' | 'critical' | 'neutral' | 'monitoring'
  icon?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, status, icon }) => {
  const statusStyles = {
    good: {
      border: 'border-emerald-100',
      bg: 'bg-emerald-50/50',
      text: 'text-emerald-900',
      subtext: 'text-emerald-700',
      accent: 'bg-emerald-500',
    },
    warning: {
      border: 'border-amber-100',
      bg: 'bg-amber-50/50',
      text: 'text-amber-900',
      subtext: 'text-amber-700',
      accent: 'bg-amber-500',
    },
    critical: {
      border: 'border-rose-100',
      bg: 'bg-rose-50/50',
      text: 'text-rose-900',
      subtext: 'text-rose-700',
      accent: 'bg-rose-500',
    },
    neutral: {
      border: 'border-gray-100',
      bg: 'bg-gray-50/50',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      accent: 'bg-gray-400',
    },
    monitoring: {
      border: 'border-sky-100',
      bg: 'bg-sky-50/50',
      text: 'text-sky-900',
      subtext: 'text-sky-700',
      accent: 'bg-sky-500',
    },
  }

  const style = statusStyles[status]

  return (
    <div className={`bg-white border ${style.border} rounded-xl p-4 shadow-sm relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${style.accent}`} />
      <div className="pl-3">
        <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
          {icon && <span>{icon}</span>}
          {label}
        </div>
        <div className={`text-2xl font-semibold ${style.text}`}>
          {value}
        </div>
        {subtext && (
          <div className={`text-xs mt-1 ${style.subtext}`}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  )
}

export const CampaignHealthMetrics: React.FC<CampaignHealthMetricsProps> = ({
  rates,
  metrics,
}) => {
  // Calculate derived rates if full rates not provided
  const bounceRate = rates?.bounceRate ?? (metrics.sent > 0 ? (metrics.bounced / metrics.sent) * 100 : 0)
  const complaintRate = rates?.complaintRate ?? (metrics.sent > 0 ? (metrics.complained / metrics.sent) * 100 : 0)
  const unsubscribeRate = rates?.unsubscribeRate ?? (metrics.delivered > 0 ? (metrics.unsubscribed / metrics.delivered) * 100 : 0)
  const failureRate = rates?.failureRate ?? (metrics.sent > 0 ? (metrics.failed / metrics.sent) * 100 : 0)
  const deliveryRate = rates?.deliveryRate ?? (metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0)

  const bounceStatus = getBounceMetricStatus(bounceRate, metrics.sent)
  const bounceSubtext =
    metrics.sent < DELIVERABILITY_MIN_SAMPLE_WARN && bounceRate > 3
      ? `${metrics.bounced.toLocaleString()} bounced · monitoring (${metrics.sent} sends — small sample)`
      : metrics.bounced > 0
        ? `${metrics.bounced.toLocaleString()} bounced`
        : 'No bounces'

  const getComplaintStatus = (rate: number): 'good' | 'warning' | 'critical' | 'monitoring' => {
    if (metrics.sent < DELIVERABILITY_MIN_SAMPLE_WARN && rate > 0.1) return 'monitoring'
    if (rate > 1) return 'critical'
    if (rate > 0.3) return 'warning'
    if (rate > 0.1) return 'neutral' as 'good'
    return 'good'
  }

  const getUnsubscribeStatus = (rate: number): 'good' | 'warning' | 'neutral' => {
    if (rate > 2) return 'warning'
    if (rate > 0.5) return 'neutral'
    return 'good'
  }

  const getFailureStatus = (rate: number): 'good' | 'warning' | 'neutral' => {
    if (rate > 10) return 'warning'
    if (rate > 5) return 'neutral'
    return 'good'
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        label="Delivery Rate"
        value={`${deliveryRate.toFixed(1)}%`}
        subtext={`${metrics.delivered.toLocaleString()} of ${metrics.sent.toLocaleString()}`}
        status={deliveryRate >= 95 ? 'good' : deliveryRate >= 90 ? 'neutral' : 'warning'}
        icon="📬"
      />

      <MetricCard
        label="Bounce Rate"
        value={`${bounceRate.toFixed(2)}%`}
        subtext={bounceSubtext}
        status={bounceStatus === 'monitoring' ? 'monitoring' : bounceStatus}
        icon="⚠️"
      />

      <MetricCard
        label="Complaint Rate"
        value={`${complaintRate.toFixed(2)}%`}
        subtext={metrics.complained > 0 ? `${metrics.complained.toLocaleString()} complaints` : 'No complaints'}
        status={getComplaintStatus(complaintRate)}
        icon="🚩"
      />

      <MetricCard
        label="Unsubscribe Rate"
        value={`${unsubscribeRate.toFixed(2)}%`}
        subtext={metrics.unsubscribed > 0 ? `${metrics.unsubscribed.toLocaleString()} unsubscribed` : 'No unsubscribes'}
        status={getUnsubscribeStatus(unsubscribeRate)}
        icon="🚫"
      />

      <MetricCard
        label="Failed Sends"
        value={metrics.failed.toLocaleString()}
        subtext={failureRate > 0 ? `${failureRate.toFixed(1)}% failure rate` : 'All sends successful'}
        status={getFailureStatus(failureRate)}
        icon="❌"
      />
    </div>
  )
}
