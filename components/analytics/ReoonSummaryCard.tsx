import React from 'react'
import { ReoonSummary } from '@/types/analytics'

interface ReoonSummaryCardProps {
  reoon: ReoonSummary
}

export const ReoonSummaryCard: React.FC<ReoonSummaryCardProps> = ({ reoon }) => {
  const exclusionRate = reoon.totalLeadsBeforeVerification && reoon.totalLeadsBeforeVerification > 0
    ? ((reoon.totalLeadsBeforeVerification - (reoon.totalLeadsAfterVerification || 0)) / reoon.totalLeadsBeforeVerification * 100)
    : 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        Reoon Verification
      </h3>

      {reoon.verificationJobFailed ? (
        <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
          <p className="text-sm text-rose-700 font-medium">Verification failed</p>
          <p className="text-xs text-rose-600 mt-1">
            {reoon.errorMessage || 'The verification job encountered an error.'}
          </p>
          {reoon.failedAt && (
            <p className="text-xs text-rose-500 mt-1">
              Failed at: {new Date(reoon.failedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="text-sm text-gray-600">Mode</div>
            <div className="text-sm font-medium text-gray-900">
              {reoon.mode === 'bulk' ? 'Bulk verification' : reoon.mode || 'Standard'}
            </div>
          </div>

          {reoon.totalLeadsBeforeVerification !== null && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="text-sm text-gray-600">Leads before verification</div>
              <div className="text-sm font-medium text-gray-900">
                {reoon.totalLeadsBeforeVerification.toLocaleString()}
              </div>
            </div>
          )}

          {reoon.totalLeadsAfterVerification !== null && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="text-sm text-gray-600">Leads after verification</div>
              <div className="text-sm font-medium text-green-600">
                {reoon.totalLeadsAfterVerification.toLocaleString()}
              </div>
            </div>
          )}

          {reoon.excludedAsRisky !== null && reoon.excludedAsRisky > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="text-sm text-gray-600">Excluded as risky</div>
              <div className="text-sm font-medium text-amber-600">
                {reoon.excludedAsRisky.toLocaleString()}
                {exclusionRate > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({exclusionRate.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          {exclusionRate > 0 && (
            <div className="pt-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  style={{ width: `${Math.min(exclusionRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {exclusionRate.toFixed(1)}% of leads excluded after verification
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
