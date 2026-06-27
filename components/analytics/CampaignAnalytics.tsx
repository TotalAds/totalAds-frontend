import React, { useMemo, useState } from 'react'
import { CampaignAnalyticsProps } from '@/types/analytics'
import { HealthBanner } from './HealthBanner'
import { DeliverabilityAlertBanner } from './DeliverabilityAlertBanner'
import { DeliverabilityStatusCard } from './DeliverabilityStatusCard'
import { HeroMetrics } from './HeroMetrics'
import { CampaignHealthMetrics } from './CampaignHealthMetrics'
import { EngagementFunnel } from './EngagementFunnel'
import { SequenceFlow } from './SequenceFlow'
import { EmailDetails } from './EmailDetails'
import { TrendsChart } from './TrendsChart'
import { LeadActivityTable } from './LeadActivityTable'
import { QueueStatus } from './QueueStatus'
import { TodayStatsCard } from './TodayStatsCard'
import { ReoonSummaryCard } from './ReoonSummaryCard'
import { OptimizationInsights } from './OptimizationInsights'
import { DeliverabilitySafeguardsInfo } from '@/components/email/DeliverabilitySafeguardsInfo'
import { DeliverabilityAcknowledgmentModal } from '@/components/campaign-builder/DeliverabilityAcknowledgmentModal'
import { acknowledgeDeliverabilityPause } from '@/utils/api/emailClient'
import toast from 'react-hot-toast'

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({
  mode,
  campaign,
  metrics,
  rates,
  steps,
  leads,
  trendData,
  onStopCampaign,
  onEditCampaign,
  onDownloadReport,
  onBack,
  stopping,
  downloading,
  showDownload = true,
  deliverability,
  sendVolume,
  reoon,
  todayVerification,
  progress,
  domainId,
  campaignId,
  onMarkReplied,
  onDeliverabilityAcknowledged,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'trends' | 'leads'>('flow')
  const [selectedStep, setSelectedStep] = useState<number | 'all'>('all')
  const [showAckModal, setShowAckModal] = useState(false)
  const [ackSubmitting, setAckSubmitting] = useState(false)

  // Computed values
  const openRate = metrics.sent > 0 ? ((metrics.opened / metrics.sent) * 100).toFixed(1) : '0.0'
  const clickRate = metrics.opened > 0 ? ((metrics.clicked / metrics.opened) * 100).toFixed(1) : '0.0'
  const replyRate = metrics.sent > 0 ? ((metrics.replied / metrics.sent) * 100).toFixed(1) : '0.0'
  
  const industryAvgOpenRate = 21
  const openRateMultiplier = (parseFloat(openRate) / industryAvgOpenRate).toFixed(1)
  
  const showHealthBanner = metrics.opened > 0 || metrics.sent > 0
  const progressPercent = progress?.percentage ?? (campaign.totalEmails > 0 
    ? Math.round((campaign.sentEmails / campaign.totalEmails) * 100) 
    : 0)
  
  const isCancelled = campaign.status === 'cancelled'
  const isPaused = campaign.status === 'paused'
  const isSending = campaign.status === 'sending' || campaign.status === 'live'
  const isCompleted = campaign.status === 'completed'
  const requiresDeliverabilityAck = Boolean(campaign.requiresDeliverabilityAcknowledgment)
  const deliverabilityUserMessage = useMemo(
    () =>
      deliverability?.alerts?.find((alert) => alert.userMessage)?.userMessage ||
      deliverability?.alerts?.[0]?.userMessage,
    [deliverability?.alerts]
  )

  const handleResumeAfterAck = async () => {
    if (!domainId || !campaignId) {
      toast.error('Missing campaign context')
      return
    }
    setAckSubmitting(true)
    try {
      await acknowledgeDeliverabilityPause(domainId, campaignId)
      toast.success('Acknowledgment recorded. You can resume sending.')
      setShowAckModal(false)
      onDeliverabilityAcknowledged?.()
      onEditCampaign?.()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to record acknowledgment')
    } finally {
      setAckSubmitting(false)
    }
  }

  const handleResumeClick = () => {
    if (requiresDeliverabilityAck) {
      setShowAckModal(true)
      return
    }
    onEditCampaign?.()
  }
  
  const sequenceStepNumbers = Array.from(
    new Set((steps || []).map((step) => step.stepNumber))
  ).sort((a, b) => a - b)

  const filteredLeads =
    selectedStep === 'all'
      ? leads
      : leads.filter((lead) => (lead.stepNumber || 0) === selectedStep)

  const filteredTrendData =
    selectedStep === 'all'
      ? trendData
      : trendData.filter((point) => point.stepNumber === selectedStep)

  const hasMissingStepMetadata = mode === 'sequence' && (!steps || steps.length === 0)
  const hasNoTrendData = filteredTrendData.length === 0

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans text-gray-900 bg-gray-50 min-h-screen">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div className="flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span aria-hidden>←</span>
              Back to campaigns
            </button>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  isCancelled
                    ? 'bg-gray-50 text-gray-600 border-gray-200'
                    : isPaused
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : isCompleted
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-100'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCancelled ? 'bg-gray-400' : isPaused ? 'bg-amber-500' : isCompleted ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
                {isCancelled ? 'Stopped' : isPaused ? 'Paused' : isCompleted ? 'Completed' : 'Live'}
              </span>
              
              {/* Activity Badge */}
              {!isCancelled && !isPaused && !isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {isSending ? 'Sending' : 'Active'}
                </span>
              )}
              
              {/* Mode Badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                {mode === 'sequence' ? `${steps?.length || 0}-step sequence` : 'Single email'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>
              <span className="text-gray-400">Started:</span>{' '}
              <span className="font-medium text-gray-700">{campaign.startedAt}</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-400">From:</span>{' '}
              <span className="font-medium text-gray-700">{campaign.sender}</span>
            </p>
            <p className="text-xs">
              <span className="font-semibold text-gray-900">{campaign.sentEmails.toLocaleString()}</span>
              <span className="text-gray-400"> of </span>
              <span className="font-semibold text-gray-900">{campaign.totalEmails.toLocaleString()}</span>
              <span className="text-gray-400"> emails </span>
              {progressPercent > 0 && (
                <span className="text-gray-400">({progressPercent}% complete)</span>
              )}
            </p>
          </div>
        </div>
        
        {!embedded && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <DeliverabilitySafeguardsInfo variant="compact" />

            {!isCancelled && onStopCampaign && (
              <button
                onClick={onStopCampaign}
                disabled={stopping}
                className="px-4 py-2 text-xs font-medium bg-red-50 text-red-600 border border-red-100 rounded-lg shadow-sm hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                {stopping ? 'Stopping...' : 'Stop campaign'}
              </button>
            )}

            {isPaused && onEditCampaign && (
              <button
                onClick={handleResumeClick}
                className="px-4 py-2 text-xs font-medium bg-amber-600 text-white border border-amber-700 rounded-lg shadow-sm hover:bg-amber-700 transition-colors"
              >
                Resume campaign
              </button>
            )}

            {showDownload && onDownloadReport && (
              <button
                onClick={onDownloadReport}
                disabled={downloading}
                className="px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {downloading ? 'Downloading...' : 'Download report'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* DELIVERABILITY STATUS */}
      {deliverability?.alerts?.length ? (
        <DeliverabilityStatusCard alerts={deliverability.alerts} />
      ) : null}

      {/* DELIVERABILITY ALERTS */}
      {(deliverability?.alerts?.length || deliverability?.throttledPendingCount) ? (
        <DeliverabilityAlertBanner
          alerts={deliverability?.alerts || []}
          throttledPendingCount={deliverability?.throttledPendingCount || 0}
        />
      ) : isPaused ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">⏸</span>
            <div>
              <p className="font-medium">Campaign is paused</p>
              <p className="text-amber-800/80 text-xs mt-1">
                If this was due to deliverability issues, fix list quality or wait for sender
                health to recover, then resume sending.{' '}
                <DeliverabilitySafeguardsInfo variant="link" className="inline" />
              </p>
            </div>
          </div>
        </div>
      ) : isSending ? (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ℹ</span>
            <span>
              Daily sender caps and bounce rates can change automatically during sending.
            </span>
          </div>
          <DeliverabilitySafeguardsInfo variant="link" />
        </div>
      ) : null}

      {/* HEALTH BANNER */}
      {showHealthBanner && parseFloat(openRate) > 0 && (
        <HealthBanner
          openRate={openRate}
          openRateMultiplier={openRateMultiplier}
          pending={metrics.pending}
        />
      )}

      {/* PROGRESS BAR */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500 tracking-wide">
            Campaign progress
          </span>
          <span className="font-medium text-gray-900">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* HERO METRICS - Engagement */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Engagement Metrics
        </h2>
        <HeroMetrics
          openRate={openRate}
          openRateMultiplier={openRateMultiplier}
          clickRate={clickRate}
          replyRate={replyRate}
          pending={metrics.pending}
          replied={metrics.replied}
        />
      </div>

      {/* DELIVERABILITY METRICS */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Deliverability Health
        </h2>
        <CampaignHealthMetrics
          rates={rates}
          metrics={metrics}
        />
      </div>

      {/* ENGAGEMENT FUNNEL */}
      <EngagementFunnel metrics={metrics} />

      {/* TODAY'S ACTIVITY & REOON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {todayVerification && (
          <TodayStatsCard
            sentToday={todayVerification.sent}
            blockedToday={todayVerification.blocked}
            verifiedToday={todayVerification.verified}
          />
        )}
        {sendVolume && (
          <QueueStatus 
            sent={metrics.sent} 
            pending={metrics.pending} 
            failed={metrics.failed}
            sendVolume={sendVolume}
          />
        )}
        {reoon?.used && (
          <ReoonSummaryCard reoon={reoon} />
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'flow'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {mode === 'sequence' ? 'Sequence Flow' : 'Email Details'}
            {mode === 'sequence' && steps && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {steps.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'trends'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            Trends & Charts
            {trendData.length > 0 && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {trendData.length} days
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            Lead Activity
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {campaign.totalEmails.toLocaleString()}
            </span>
          </span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'flow' && (
        mode === 'sequence' && steps ? (
          <SequenceFlow
            steps={steps}
            campaign={campaign}
            selectedStep={selectedStep}
            onStepSelect={setSelectedStep}
          />
        ) : (
          <EmailDetails campaign={campaign} metrics={metrics} />
        )
      )}

      {activeTab === 'trends' && (
        <>
          {hasNoTrendData && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                No trend data available yet. Data appears after sends/open events are recorded.
              </div>
            </div>
          )}
          <TrendsChart
            data={filteredTrendData}
            metrics={metrics}
            sendVolume={sendVolume}
            sequenceSteps={mode === 'sequence' ? sequenceStepNumbers : []}
            selectedStep={selectedStep}
            onStepChange={setSelectedStep}
          />
        </>
      )}

      {activeTab === 'leads' && (
        <LeadActivityTable
          leads={filteredLeads}
          sequenceSteps={mode === 'sequence' ? sequenceStepNumbers : []}
          selectedStep={selectedStep}
          onStepChange={setSelectedStep}
          campaignId={campaignId}
          domainId={domainId}
          onMarkReplied={onMarkReplied}
        />
      )}

      {/* BOTTOM ROW - OPTIMIZATION */}
      <div className="mt-8 pb-12">
        <OptimizationInsights
          mode={mode}
          openRate={Number(openRate)}
          clickRate={Number(clickRate)}
          replied={metrics.replied}
          sent={metrics.sent}
        />
      </div>

      <DeliverabilityAcknowledgmentModal
        open={showAckModal}
        userMessage={deliverabilityUserMessage}
        submitting={ackSubmitting}
        onConfirm={handleResumeAfterAck}
        onClose={() => setShowAckModal(false)}
      />
    </div>
  )
}