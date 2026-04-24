import React from 'react'

interface LeadActivityTableProps {
  leads: Array<{
    email: string
    stepLabel: string
    status: 'delivered' | 'opened' | 'pending' | 'failed'
    nextSend?: string
    sent: boolean
    read: boolean
    replied: boolean
    onMarkReplied: () => void
  }>
  sequenceSteps?: number[]
  selectedStep?: number | 'all'
  onStepChange?: (step: number | 'all') => void
}

export const LeadActivityTable: React.FC<LeadActivityTableProps> = ({
  leads,
  sequenceSteps = [],
  selectedStep = 'all',
  onStepChange,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-sm font-medium text-gray-900">Lead-level activity</h3>
        {sequenceSteps.length > 0 && onStepChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sequence step</span>
            <select
              value={selectedStep}
              onChange={(e) =>
                onStepChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All steps</option>
              {sequenceSteps.map((step) => (
                <option key={step} value={step}>
                  Step {step}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 font-medium">Lead</th>
              <th className="px-5 py-3 font-medium">Step</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Next Send</th>
              <th className="px-5 py-3 font-medium text-center">Sent</th>
              <th className="px-5 py-3 font-medium text-center">Read</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((lead, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors duration-150 group"
              >
                <td className="px-5 py-3 font-medium text-gray-900">{lead.email}</td>
                <td className="px-5 py-3 text-gray-500">{lead.stepLabel}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      lead.status === 'delivered'
                        ? 'bg-green-50 text-green-700'
                        : lead.status === 'opened'
                        ? 'bg-blue-50 text-blue-700'
                        : lead.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">{lead.nextSend || '—'}</td>
                <td className="px-5 py-3 text-center">
                  <div
                    className={`w-2 h-2 rounded-full mx-auto ${
                      lead.sent ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <div
                    className={`w-2 h-2 rounded-full mx-auto ${
                      lead.read ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </td>
                <td className="px-5 py-3">
                  {lead.replied ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      Mark as replied ✓
                    </span>
                  ) : (
                    <button
                      onClick={lead.onMarkReplied}
                      className="text-blue-600 font-medium hover:text-green-600 hover:underline transition-colors flex items-center gap-1 group-hover:opacity-100 opacity-80"
                    >
                      <span className="group-hover:hidden">Mark as replied</span>
                      <span className="hidden group-hover:inline">Mark as replied ✓</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
