export interface DeliverabilityAlert {
  id: string
  type: 'quota_reduced' | 'sender_paused' | 'daily_limit_reached' | 'campaign_auto_paused'
  severity: 'info' | 'warning' | 'critical'
  senderId: string
  senderEmail: string
  currentCap: number
  usedToday: number
  remainingToday: number
  healthStatus?: string
  bounceRate7d?: number
  complaintRate7d?: number
  sent7d?: number
  deliverabilityAction?: 'none' | 'warn' | 'slow' | 'pause' | 'emergency'
  rollingBounceAction?: 'none' | 'warn' | 'slow' | 'pause' | 'emergency'
  reasons: string[]
  recordedAt: string
  source: 'live' | 'event'
}

export interface CampaignDeliverabilitySummary {
  alerts: DeliverabilityAlert[]
  hasActiveIssue: boolean
  throttledPendingCount: number
}

export interface CampaignRates {
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
  deliveryRate: number
  failureRate: number
  unsubscribeRate: number
  ctrRate: number
}

export interface SendVolume {
  calendar: 'utc'
  sentToday: number
  sentYesterday: number
  sendsByDay: Array<{ date: string; count: number }>
}

export interface ReoonSummary {
  used: boolean
  mode: string | null
  totalLeadsBeforeVerification: number | null
  totalLeadsAfterVerification: number | null
  excludedAsRisky: number | null
  verificationJobFailed?: boolean
  errorMessage?: string | null
  failedAt?: string | null
}

export interface TodayVerification {
  verified: number
  blocked: number
  sent: number
}

export interface CampaignProgress {
  percentage: number
  completed: number
  total: number
}

export interface CampaignSteps {
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
}

export interface CampaignLead {
  email: string
  stepLabel: string
  stepNumber?: number
  status: 'delivered' | 'opened' | 'pending' | 'failed' | 'bounced' | 'complained' | 'unsubscribed'
  nextSend?: string
  sent: boolean
  read: boolean
  replied: boolean
  clicked?: boolean
  bounced?: boolean
  complained?: boolean
  unsubscribed?: boolean
  onMarkReplied: () => void
}

export interface CampaignAnalyticsProps {
  mode: 'sequence' | 'single'
  campaign: {
    id: string
    name: string
    status: 'live' | 'paused' | 'completed' | 'sending' | 'scheduled' | 'draft' | 'cancelled' | 'running'
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
  rates?: CampaignRates
  steps?: CampaignSteps[]
  leads: CampaignLead[]
  trendData: Array<{
    date: string
    sent: number
    opened: number
    clicked: number
    bounced?: number
    complained?: number
    unsubscribed?: number
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
  sendVolume?: SendVolume
  reoon?: ReoonSummary | null
  todayVerification?: TodayVerification
  progress?: CampaignProgress
  domainId?: string
  campaignId?: string
  onMarkReplied?: (leadId: string) => Promise<void>
}
