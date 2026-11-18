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
    verificationBlocked?: number
    bounced?: number
    complained?: number
    unsubscribed?: number
    pending?: number
    resolved?: number
    processedPercent?: number
    sentPercent?: number
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
  color = 'bg-gray-50 text-gray-700 border-gray-200',
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${color}`}>
    <span className="text-gray-400">{label}:</span>
    <span className="font-medium">{value.toLocaleString()}</span>
  </span>
)

const StepProgress: React.FC<{
  sent: number
  resolved: number
  total: number
  verificationBlocked: number
  pending: number
  status: 'done' | 'pending' | 'waiting'
}> = ({ sent, resolved, total, verificationBlocked, pending, status }) => {
  const processedPercent = total > 0 ? Math.round((resolved / total) * 100) : 0
  const sentPercent = total > 0 ? Math.round((sent / total) * 100) : 0
  const blockedPercent = total > 0 ? Math.round((verificationBlocked / total) * 100) : 0

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
        <span className="text-gray-600">
          <span className="font-medium text-gray-900">{processedPercent}%</span>
          <span className="text-gray-400"> processed</span>
          <span className="text-gray-300 mx-1.5">·</span>
          <span className="font-medium text-gray-900">{sentPercent}%</span>
          <span className="text-gray-400"> sent</span>
        </span>
        <span className="text-gray-400">
          {resolved.toLocaleString()} of {total.toLocaleString()} leads
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className={`h-full ${status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(sentPercent, 100)}%` }}
          title={`${sent.toLocaleString()} sent`}
        />
        {blockedPercent > 0 ? (
          <div
            className="h-full bg-violet-400"
            style={{ width: `${Math.min(blockedPercent, 100 - sentPercent)}%` }}
            title={`${verificationBlocked.toLocaleString()} blocked by verification`}
          />
        ) : null}
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        {sent.toLocaleString()} sent
        {verificationBlocked > 0
          ? ` · ${verificationBlocked.toLocaleString()} blocked by verification`
          : ''}
        {pending > 0 ? ` · ${pending.toLocaleString()} still queued` : ''}
        {pending === 0 && resolved >= total && total > 0 ? ' · step finished' : ''}
      </p>
    </div>
  )
}

export const SequenceFlow: React.FC<SequenceFlowProps> = ({
  steps,
  campaign,
  selectedStep,
  onStepSelect,
}) => {
  const totalPending = steps.reduce((sum, step) => sum + (step.pending || 0), 0)

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Sequence Timeline</h3>
          <p className="text-xs text-gray-500">
            {steps.length} steps · {campaign.sentEmails.toLocaleString()} total sends across sequence
            {totalPending > 0 ? ` · ${totalPending.toLocaleString()} still queued` : ''}
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
        <div className="absolute left-4 md:left-5 top-6 bottom-6 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {steps.map((step) => {
            const isSelected = selectedStep === step.stepNumber
            const verificationBlocked = step.verificationBlocked || 0
            const pending = step.pending || 0
            const resolved =
              step.resolved != null
                ? step.resolved
                : step.sent +
                  verificationBlocked +
                  (step.failed || 0) +
                  (step.bounced || 0)
            const openRate = step.sent > 0 ? Math.round((step.opened / step.sent) * 100) : 0
            const replyRate = step.opened > 0 ? Math.round((step.replied / step.opened) * 100) : 0

            return (
              <div
                key={step.stepNumber}
                className={`relative pl-12 md:pl-14 transition-all ${
                  isSelected ? 'scale-[1.01]' : ''
                }`}
              >
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

                <button
                  type="button"
                  onClick={() => onStepSelect(step.stepNumber)}
                  className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Email {step.stepNumber}
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

                  <div className="mb-4">
                    <StepProgress
                      sent={step.sent}
                      resolved={resolved}
                      total={step.totalInStep}
                      verificationBlocked={verificationBlocked}
                      pending={pending}
                      status={step.status}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <MetricBadge label="Sent" value={step.sent} />
                    {step.opened > 0 ? (
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
                    {pending > 0 ? (
                      <MetricBadge
                        label="Queued"
                        value={pending}
                        color="bg-amber-50 text-amber-700 border-amber-200"
                      />
                    ) : null}
                  </div>

                  {(verificationBlocked > 0 ||
                    (step.failed || 0) > 0 ||
                    (step.bounced || 0) > 0 ||
                    (step.unsubscribed || 0) > 0) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {verificationBlocked > 0 ? (
                        <MetricBadge
                          label="Verification blocked"
                          value={verificationBlocked}
                          color="bg-violet-50 text-violet-700 border-violet-200"
                        />
                      ) : null}
                      {(step.failed || 0) > 0 ? (
                        <MetricBadge
                          label="Failed"
                          value={step.failed || 0}
                          color="bg-orange-50 text-orange-700 border-orange-200"
                        />
                      ) : null}
                      {(step.bounced || 0) > 0 ? (
                        <MetricBadge
                          label="Bounced"
                          value={step.bounced || 0}
                          color="bg-rose-50 text-rose-700 border-rose-200"
                        />
                      ) : null}
                      {(step.unsubscribed || 0) > 0 ? (
                        <MetricBadge
                          label="Unsubscribed"
                          value={step.unsubscribed || 0}
                          color="bg-gray-50 text-gray-700 border-gray-200"
                        />
                      ) : null}
                    </div>
                  )}

                  {step.sent > 0 && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs flex-wrap">
                      <span className="text-gray-500">
                        Open rate: <span className="font-semibold text-gray-700">{openRate}%</span>
                      </span>
                      {step.replied > 0 && (
                        <span className="text-gray-500">
                          Reply rate: <span className="font-semibold text-gray-700">{replyRate}%</span>
                        </span>
                      )}
                      {step.nextSendAt && step.status === 'pending' && (
                        <span className="text-amber-600 md:ml-auto">
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
