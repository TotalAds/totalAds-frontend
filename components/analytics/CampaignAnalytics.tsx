import React, { useState } from 'react'
import { CampaignAnalyticsProps } from '@/types/analytics'
import { HealthBanner } from './HealthBanner'
import { HeroMetrics } from './HeroMetrics'
import { EngagementFunnel } from './EngagementFunnel'
import { SequenceFlow } from './SequenceFlow'
import { EmailDetails } from './EmailDetails'
import { TrendsChart } from './TrendsChart'
import { LeadActivityTable } from './LeadActivityTable'
import { QueueStatus } from './QueueStatus'
import { OptimizationInsights } from './OptimizationInsights'

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({
  mode,
  campaign,
  metrics,
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
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'trends' | 'leads'>('flow')
  const [selectedStep, setSelectedStep] = useState<number | 'all'>('all')

  // Computed values
  const openRate = metrics.delivered > 0 ? ((metrics.opened / metrics.delivered) * 100).toFixed(1) : '0.0'
  const deliveryRate = metrics.sent > 0 ? ((metrics.delivered / metrics.sent) * 100).toFixed(1) : '0.0'
  const clickRate = metrics.opened > 0 ? ((metrics.clicked / metrics.opened) * 100).toFixed(1) : '0.0'
  
  const industryAvgOpenRate = 21
  const openRateMultiplier = (parseFloat(openRate) / industryAvgOpenRate).toFixed(1)
  
  const showHealthBanner = metrics.opened > 0 || metrics.sent > 0
  const progressPercent = campaign.totalEmails > 0 
    ? Math.round((campaign.sentEmails / campaign.totalEmails) * 100) 
    : 0
  const isCancelled = campaign.status === 'cancelled'
  const isSending = campaign.status === 'sending' || campaign.status === 'live'
  const sequenceStepNumbers = Array.from(
    new Set(
      (steps || []).map((step) => step.stepNumber)
    )
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
    <div className="max-w-[1000px] mx-auto py-8 px-4 font-sans text-gray-900 bg-gray-50 min-h-screen">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span aria-hidden>←</span>
              Back to campaigns
            </button>
          )}
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-medium tracking-tight">{campaign.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {isCancelled ? 'Stopped' : 'Live'}
            </span>
            {!isCancelled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {isSending ? 'Sending' : 'Active'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Started {campaign.startedAt} · From: {campaign.sender} ·{' '}
            <strong className="text-gray-900 font-medium">
              {campaign.sentEmails} of {campaign.totalEmails} emails sent
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditCampaign}
            disabled={!onEditCampaign}
            className="px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Edit {mode === 'sequence' ? 'sequence' : 'email'}
          </button>
          {!isCancelled && onStopCampaign && (
            <button
              onClick={onStopCampaign}
              disabled={stopping}
              className="px-4 py-2 text-xs font-medium bg-red-50 text-red-600 border border-red-100 rounded-lg shadow-sm hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              {stopping ? 'Stopping...' : 'Stop campaign'}
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
      </div>

      {/* HEALTH BANNER */}
      {showHealthBanner && parseFloat(openRate) > 0 && (
        <HealthBanner
          deliveryRate={deliveryRate}
          openRate={openRate}
          openRateMultiplier={openRateMultiplier}
          pending={metrics.pending}
        />
      )}

      {hasMissingStepMetadata && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Sequence metadata is still syncing. Step-level cards will appear as soon as processing completes.
        </div>
      )}

      {/* PROGRESS BAR */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500 tracking-wide">
            Your campaign is live and converting — {campaign.sentEmails} of {campaign.totalEmails} emails out
          </span>
          <span className="font-medium text-gray-900">{progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* HERO METRICS */}
      <HeroMetrics
        openRate={openRate}
        openRateMultiplier={openRateMultiplier}
        deliveryRate={deliveryRate}
        clickRate={clickRate}
        pending={metrics.pending}
        sent={metrics.sent}
        delivered={metrics.delivered}
      />

      {/* ENGAGEMENT FUNNEL */}
      <EngagementFunnel metrics={metrics} />

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
          {mode === 'sequence' ? 'Sequence Flow' : 'Email Details'}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'trends'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Trends & Charts
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Lead-level Activity
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
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              No trend points are available for this filter yet. Data appears after sends/open events are recorded.
            </div>
          )}
          <TrendsChart
            data={filteredTrendData}
            metrics={metrics}
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
        />
      )}

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12 mt-8">
        <QueueStatus sent={metrics.sent} pending={metrics.pending} failed={metrics.failed} />
        <OptimizationInsights
          mode={mode}
          deliveryRate={Number(deliveryRate)}
          openRate={Number(openRate)}
          clickRate={Number(clickRate)}
          replied={metrics.replied}
          sent={metrics.sent}
        />
      </div>
    </div>
  )
}
