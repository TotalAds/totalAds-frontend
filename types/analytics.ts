export interface DeliverabilityAlert {
  id: string
  type: 'quota_reduced' | 'sender_paused' | 'daily_limit_reached'
  severity: 'info' | 'warning' | 'critical'
  senderId: string
  senderEmail: string
  currentCap: number
  usedToday: number
  remainingToday: number
  healthStatus?: string
  bounceRate7d?: number
  complaintRate7d?: number
  reasons: string[]
  recordedAt: string
  source: 'live' | 'event'
}

export interface CampaignDeliverabilitySummary {
  alerts: DeliverabilityAlert[]
  hasActiveIssue: boolean
  throttledPendingCount: number
}

export interface CampaignAnalyticsProps {
  mode: 'sequence' | 'single'
  campaign: {
    id: string
    name: string
    status: 'live' | 'paused' | 'completed' | 'sending' | 'scheduled' | 'draft' | 'cancelled'
    sender: string
    subject?: string
    replyTo?: string
    previewText?: string
    fromEmail: string
    createdAt: string
    startedAt: string
    totalEmails: number
    sentEmails: number
  }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    replied: number
    bounced: number
    complained: number
    unsubscribed: number
    pending: number
    failed: number
    rejected: number
  }
  steps?: Array<{
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
  leads: Array<{
    email: string
    stepLabel: string
    stepNumber?: number
    status: 'delivered' | 'opened' | 'pending' | 'failed'
    nextSend?: string
    sent: boolean
    read: boolean
    replied: boolean
    onMarkReplied: () => void
  }>
  trendData: Array<{
    date: string
    sent: number
    opened: number
    clicked: number
    stepNumber?: number
  }>
  onStopCampaign?: () => void
  onEditCampaign?: () => void
  onDownloadReport?: () => void
  onBack?: () => void
  stopping?: boolean
  downloading?: boolean
  showDownload?: boolean
  deliverability?: CampaignDeliverabilitySummary | null
}
