import React from 'react'

interface SequenceFlowProps {
  steps: Array<{
    stepNumber: number
    dayOffset: number
    subject: string
    totalInStep: number
    sent: number
    delivered: number
    opened: number
    replied: number
    failed?: number
    bounced?: number
    complained?: number
    unsubscribed?: number
    pending?: number
    nextSendAt?: string
    status: 'done' | 'pending' | 'waiting'
  }>
  campaign: {
    sentEmails: number
    totalEmails: number
  }
  selectedStep: number | 'all'
  onStepSelect: (stepNumber: number | 'all') => void
}

const StepStatusBadge: React.FC<{ status: 'done' | 'pending' | 'waiting' }> = ({ status }) => {
  const styles = {
    done: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    waiting: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  const labels = {
    done: 'Complete',
    pending: 'In Progress',
    waiting: 'Waiting',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

const MetricBadge: React.FC<{ label: string; value: number; color?: string }> = ({ 
  label, 
  value, 
  color = 'bg-gray-50 text-gray-700 border-gray-200' 
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${color}`}>
    <span className="text-gray-400">{label}:</span>
    <span className="font-medium">{value.toLocaleString()}</span>
  </span>
)

const ProgressBar: React.FC<{ value: number; total: number; color?: string }> = ({ 
  value, 
  total, 
  color = 'bg-blue-500' 
}) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{percent}% complete</span>
        <span className="text-gray-400">{value} of {total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

export const SequenceFlow: React.FC<SequenceFlowProps> = ({
  steps,
  campaign,
  selectedStep,
  onStepSelect,
}) => {
  const remaining = campaign.totalEmails - campaign.sentEmails

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Sequence Timeline</h3>
          <p className="text-xs text-gray-500">
            {steps.length} steps · {campaign.sentEmails.toLocaleString()} sent · {remaining.toLocaleString()} remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter:</span>
          <button
            type="button"
            onClick={() => onStepSelect('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selectedStep === 'all'
                ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Steps
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline connector line */}
        <div className="absolute left-4 md:left-5 top-6 bottom-6 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isSelected = selectedStep === step.stepNumber
            const openRate = step.sent > 0 ? Math.round((step.opened / step.sent) * 100) : 0
            const replyRate = step.opened > 0 ? Math.round((step.replied / step.opened) * 100) : 0

            return (
              <div
                key={step.stepNumber}
                className={`relative pl-12 md:pl-14 transition-all ${
                  isSelected ? 'scale-[1.01]' : ''
                }`}
              >
                {/* Timeline dot */}
                <div 
                  className={`absolute left-0 md:left-1 top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                    step.status === 'done'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : step.status === 'pending'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  <span className="text-sm font-semibold">{step.stepNumber}</span>
                </div>

                {/* Card */}
                <button
                  type="button"
                  onClick={() => onStepSelect(step.stepNumber)}
                  className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Step {step.stepNumber}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">
                          Day {step.dayOffset}
                        </span>
                        <StepStatusBadge status={step.status} />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {step.subject}
                      </h4>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <ProgressBar 
                      value={step.sent} 
                      total={step.totalInStep} 
                      color={step.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}
                    />
                  </div>

                  {/* Metrics Row */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <MetricBadge label="Sent" value={step.sent} />
                    {step.delivered > 0 ? (
                      <MetricBadge 
                        label="Opened" 
                        value={step.opened} 
                        color="bg-green-50 text-green-700 border-green-200"
                      />
                    ) : null}
                    {step.replied > 0 ? (
                      <MetricBadge 
                        label="Replied" 
                        value={step.replied} 
                        color="bg-indigo-50 text-indigo-700 border-indigo-200"
                      />
                    ) : null}
                    {step.pending && step.pending > 0 ? (
                      <MetricBadge 
                        label="Pending" 
                        value={step.pending} 
                        color="bg-amber-50 text-amber-700 border-amber-200"
                      />
                    ) : null}
                  </div>

                  {/* Negative Metrics */}
                  {(step.failed || step.bounced || step.complained || step.unsubscribed) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {step.failed && step.failed > 0 ? (
                        <MetricBadge 
                          label="Failed" 
                          value={step.failed} 
                          color="bg-orange-50 text-orange-700 border-orange-200"
                        />
                      ) : null}
                      {step.bounced && step.bounced > 0 ? (
                        <MetricBadge 
                          label="Bounced" 
                          value={step.bounced} 
                          color="bg-rose-50 text-rose-700 border-rose-200"
                        />
                      ) : null}
                      {step.complained && step.complained > 0 ? (
                        <MetricBadge 
                          label="Complaints" 
                          value={step.complained} 
                          color="bg-red-50 text-red-700 border-red-200"
                        />
                      ) : null}
                      {step.unsubscribed && step.unsubscribed > 0 ? (
                        <MetricBadge 
                          label="Unsubscribed" 
                          value={step.unsubscribed} 
                          color="bg-gray-50 text-gray-700 border-gray-200"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Rate Summary */}
                  {step.sent > 0 && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">
                        Open rate: <span className="font-semibold text-gray-700">{openRate}%</span>
                      </span>
                      {step.replied > 0 && (
                        <span className="text-gray-500">
                          Reply rate: <span className="font-semibold text-gray-700">{replyRate}%</span>
                        </span>
                      )}
                      {step.nextSendAt && step.status === 'pending' && (
                        <span className="text-amber-600 ml-auto">
                          Next send: {step.nextSendAt}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
