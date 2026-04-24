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

export const SequenceFlow: React.FC<SequenceFlowProps> = ({
  steps,
  campaign,
  selectedStep,
  onStepSelect,
}) => {
  const remaining = campaign.totalEmails - campaign.sentEmails

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {steps.length} steps · {campaign.sentEmails} sent · {remaining} remaining
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter by step</span>
          <button
            type="button"
            onClick={() => onStepSelect('all')}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              selectedStep === 'all'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 items-stretch relative">
        {steps.map((step, idx) => {
          const isActive = step.status === 'done' || step.status === 'pending'
          const dotColor =
            step.status === 'done'
              ? 'bg-green-500'
              : step.status === 'pending'
              ? 'bg-amber-500'
              : 'bg-gray-200'

          const openRate = step.sent > 0 ? Math.round((step.opened / step.sent) * 100) : 0

          const isSelected = selectedStep === step.stepNumber
          return (
            <React.Fragment key={step.stepNumber}>
              <button
                type="button"
                onClick={() => onStepSelect(step.stepNumber)}
                className={`flex-1 border ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-100'
                    : isActive
                    ? 'border-blue-400'
                    : 'border-gray-200'
                } bg-white rounded-xl p-4 relative shadow-sm transition-all text-left hover:border-blue-500`}
              >
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${dotColor}`}
                />
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-2">
                  Step {step.stepNumber} · Day {step.dayOffset}
                </div>
                <div className="text-[13px] font-medium text-gray-900 mb-3 truncate w-full pr-4">
                  {step.subject}
                </div>

                {step.status === 'done' && step.sent > 0 && (
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1.5 flex justify-between">
                      <span>Sent {step.sent}</span>
                      <span>Opened {step.opened}</span>
                    </div>
                    <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${openRate}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-green-600 font-medium">
                      {openRate}% open
                    </div>
                  </div>
                )}

                {step.status === 'pending' && (
                  <div className="text-[11px] text-gray-500">
                    {step.totalInStep} queued · Sends {step.nextSendAt || 'soon'}
                  </div>
                )}

                {step.status === 'waiting' && (
                  <div className="text-[11px] text-gray-400">
                    {step.totalInStep} waiting · Day {step.dayOffset}
                  </div>
                )}
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex w-6 items-center justify-center shrink-0">
                  <div className="w-full h-px bg-gray-200 relative">
                    <span className="absolute -right-1 -top-2.5 text-gray-400 text-lg leading-none">
                      ›
                    </span>
                  </div>
                </div>
              )}
              {idx < steps.length - 1 && (
                <div className="flex md:hidden h-6 items-center justify-center shrink-0">
                  <div className="h-full w-px bg-gray-200 relative">
                    <span className="absolute -bottom-2 -left-1.5 text-gray-400 text-lg leading-none rotate-90">
                      ›
                    </span>
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
