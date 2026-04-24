"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  Send,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import CreatableSelect from "@/components/common/CreatableSelect";
import { Button } from "@/components/ui/button";
import emailClient, {
  AIGeneratedCampaignEmailStep,
  AIGeneratedCampaignResponse,
  createList,
  EmailList,
  getCampaignById,
  getCampaignEligibility,
  getDomains,
  getEmailServiceErrorMessage,
  getLists,
  LeadCategory,
  LeadTag,
} from "@/utils/api/emailClient";
import {
  getReoonStatus,
} from "@/utils/api/reoonClient";

import { useEmailProvider } from "@/hooks/useEmailProvider";
import ReoonApiKeyRequiredModal from "./ReoonApiKeyRequiredModal";
import AICampaignGeneratorModal from "./AICampaignGeneratorModal";
import AIGeneratedCampaignPanel from "./AIGeneratedCampaignPanel";
import CreateEmailModal from "./CreateEmailModal";
import RecipientSelectionModal from "./RecipientSelectionModal";
import { type SpintaxPackId } from "./spintaxUtils";


interface SinglePageCampaignBuilderProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  campaignId?: string;
  initialDomainId?: string;
  campaignMode?: "single" | "sequence";
}

interface CampaignState {
  campaignName: string;
  campaignDescription: string;
  domainId: string;
  senderIds: string[]; // Changed to array for rotation support
  emailTemplate: {
    subject: string;
    previewText?: string;
    htmlContent: string;
    textContent: string;
    /** Persisted on the sequence step for restoring the builder */
    bodyEditor: "simple" | "html";
    useSpintax: boolean;
    spintaxPackId: SpintaxPackId;
    strictGrammarMode: boolean;
    /** False until the user picks an editor/template or loads existing / AI content */
    emailBodyInitialized: boolean;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      file: File;
    }>;
  };
  replyTo?: string; // Optional comma-separated reply-to addresses
  useReplyTo: boolean; // Checkbox state for reply-to
  useAttachment: boolean; // Checkbox state for attachment
  selectedRecipients: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
  };
  selectedTags: LeadTag[];
  selectedCategories: LeadCategory[];
  /** When importing CSV recipients, new leads are added to these lists */
  selectedLists: EmailList[];
  csvData: Array<Record<string, string>>;
  columns: string[];
  emailColumn: string;
  csvUploadNote?: string;
  dailySendTime: string;
  sequenceSteps: CampaignSequenceStep[];
}

interface CampaignSequenceStep {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
  previewText?: string;
  condition?: "always" | "if_not_opened" | "if_not_replied";
  bodyEditor: "simple" | "html";
  useSpintax: boolean;
  spintaxPackId: SpintaxPackId;
  strictGrammarMode: boolean;
}

const DEFAULT_STEP_DELAYS = [0, 2, 5, 8];

function createDefaultSequenceSteps(): CampaignSequenceStep[] {
  return [
    {
      id: "step-1",
      delayDays: 0,
      subject: "Quick question about {{company}}",
      body: "Hi {{first_name | there}},\n\nQuick question - are you the right person to discuss outbound growth at {{company}}?\n\nI have one idea that could help your team book more qualified meetings.\n\nWorth sharing?",
      previewText: "A quick idea for {{company}}",
      condition: "always",
      bodyEditor: "simple",
      useSpintax: false,
      spintaxPackId: "general",
      strictGrammarMode: false,
    },
    {
      id: "step-2",
      delayDays: 2,
      subject: "Worth a look?",
      body: "Hi {{first_name | there}},\n\nFollowing up in case this got buried.\n\nTeams similar to {{company}} usually reply once we tighten follow-ups and improve first-line hooks.\n\nShould I send a 2-minute breakdown?",
      previewText: "Following up on my last note",
      condition: "if_not_replied",
      bodyEditor: "simple",
      useSpintax: false,
      spintaxPackId: "general",
      strictGrammarMode: false,
    },
    {
      id: "step-3",
      delayDays: 5,
      subject: "Last nudge",
      body: "Hi {{first_name | there}},\n\nLast nudge from me.\n\nIf improving reply rates and booked meetings is a priority this quarter, I can share exactly what we'd test first for {{company}}.\n\nOpen to it?",
      previewText: "Last nudge before I close this",
      condition: "if_not_replied",
      bodyEditor: "simple",
      useSpintax: false,
      spintaxPackId: "general",
      strictGrammarMode: false,
    },
    {
      id: "step-4",
      delayDays: 8,
      subject: "Should I close your file?",
      body: "Hi {{first_name | there}},\n\nI haven't heard back, so I'll close this out for now.\n\nIf you'd like me to reopen it later, just reply with \"revisit\" and I'll send over a tailored plan for {{company}}.",
      previewText: "Close the loop?",
      condition: "if_not_replied",
      bodyEditor: "simple",
      useSpintax: false,
      spintaxPackId: "general",
      strictGrammarMode: false,
    },
  ];
}

interface Domain {
  id: string;
  domain: string;
}

type DomainTrustLevel = "new" | "warming" | "aged" | "agency";

/** From GET /api/analytics/campaigns/:id/analytics — `sendVolume` */
interface CampaignSendVolume {
  calendar: "utc";
  sentToday: number;
  sentYesterday: number;
  sendsByDay: Array<{ date: string; count: number }>;
}

interface EmailSender {
  id: string;
  email: string;
  displayName?: string;
  domainId: string;
  verificationStatus: "pending" | "verified" | "failed";
  quota?: {
    dailyCap: number;
    used: number;
    remaining: number;
    totalSent: number;
    resetAt?: string;
    override?: number | null;
    allowed?: boolean;
    domainTrustLevel?: DomainTrustLevel;
    domainAgeInDays?: number;
    quotaMode?: "byo" | "managed";
  };
}

/** If the API never stored bodyEditor, avoid defaulting complex HTML to TipTap (it strips layout). */
function inferBodyEditorFromHtml(html: string): "simple" | "html" {
  const trimmed = html.trim();
  if (!trimmed) return "simple";
  const lower = trimmed.toLowerCase();
  if (
    /<table\b/.test(lower) ||
    /<html\b/.test(lower) ||
    /<!doctype\b/.test(lower)
  ) {
    return "html";
  }
  return "simple";
}

export default function SinglePageCampaignBuilder({
  onCancel,
  onSuccess,
  campaignId,
  initialDomainId = "",
  campaignMode = "single",
}: SinglePageCampaignBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSequenceMode = campaignMode === "sequence";
  const { sesProvider } = useEmailProvider();
  const [eligibility, setEligibility] = useState<null | {
    eligible: boolean;
    verifiedDomainCount: number;
    verifiedSenderCount: number;
    ineligibleReason?: string;
  }>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingExistingCampaign, setLoadingExistingCampaign] = useState(false);
  /** When set, Send uses this campaign id instead of creating a new one */
  const [resumeCampaignId, setResumeCampaignId] = useState<string | null>(null);
  /** Skip Reoon pre-check / async verify when list is already verified (scheduled / legacy draft) */
  const [resumeSkipVerification, setResumeSkipVerification] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [listOptions, setListOptions] = useState<EmailList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showReoonKeyRequiredModal, setShowReoonKeyRequiredModal] =
    useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  /** Full AI response; panel stays visible until user clears */
  const [aiGeneratedData, setAiGeneratedData] =
    useState<AIGeneratedCampaignResponse | null>(null);
  const [selectedSequenceStepId, setSelectedSequenceStepId] = useState<string>("step-1");
  const [showSequenceCanvasModal, setShowSequenceCanvasModal] = useState(false);
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [sequenceEditorOpen, setSequenceEditorOpen] = useState(false);
  const prevDomainIdRef = useRef<string>(initialDomainId);

  const idFromQuery = searchParams.get("id");
  const effectiveCampaignId = campaignId || idFromQuery || undefined;
  const liveSequenceEditMode = searchParams.get("liveSequenceEdit") === "1";
  const canResumeSendingCampaign = liveSequenceEditMode && isSequenceMode;

  const [sendVolume, setSendVolume] = useState<CampaignSendVolume | null>(null);
  const [sendVolumeLoading, setSendVolumeLoading] = useState(false);

  const [state, setState] = useState<CampaignState>({
    campaignName: "",
    campaignDescription: "",
    domainId: initialDomainId,
    senderIds: [],
    emailTemplate: {
      subject: "",
      previewText: "",
      htmlContent: "",
      textContent: "",
      bodyEditor: "simple",
      useSpintax: false,
      spintaxPackId: "general",
      strictGrammarMode: false,
      emailBodyInitialized: false,
      attachments: [],
    },
    replyTo: "",
    useReplyTo: false,
    useAttachment: false,
    selectedRecipients: {
      type: "individual",
      ids: [],
      count: 0,
    },
    selectedTags: [],
    selectedCategories: [],
    selectedLists: [],
    csvData: [],
    columns: [],
    emailColumn: "email",
    csvUploadNote: undefined,
    dailySendTime: "09:00",
    sequenceSteps: createDefaultSequenceSteps(),
  });

  const syncPrimaryTemplate = (
    steps: CampaignSequenceStep[],
    previous: CampaignState["emailTemplate"]
  ) => {
    const first = steps[0];
    if (!first) return previous;
    return {
      ...previous,
      subject: first.subject,
      previewText: first.previewText || "",
      htmlContent: first.body,
      textContent: first.body,
      bodyEditor: first.bodyEditor,
      useSpintax: first.useSpintax,
      spintaxPackId: first.spintaxPackId,
      strictGrammarMode: first.strictGrammarMode,
      emailBodyInitialized: first.body.trim().length > 0,
    };
  };

  const updateSequenceSteps = (
    updater: (steps: CampaignSequenceStep[]) => CampaignSequenceStep[]
  ) => {
    setState((prev) => {
      const nextSteps = updater(prev.sequenceSteps);
      return {
        ...prev,
        sequenceSteps: nextSteps,
        emailTemplate: syncPrimaryTemplate(nextSteps, prev.emailTemplate),
      };
    });
  };

  useEffect(() => {
    if (state.sequenceSteps.length === 0) return;
    const exists = state.sequenceSteps.some((step) => step.id === selectedSequenceStepId);
    if (!exists) {
      setSelectedSequenceStepId(state.sequenceSteps[0].id);
    }
  }, [selectedSequenceStepId, state.sequenceSteps]);

  // Check eligibility and load domains
  useEffect(() => {
    const initialize = async () => {
      try {
        const [eligibilityData, domainsData] = await Promise.all([
          getCampaignEligibility(),
          getDomains(1, 100),
        ]);
        setEligibility(eligibilityData);
        const loadedDomains = domainsData.data.domains || [];
        setDomains(loadedDomains);

        // Get verified domains (domains that are verified and have DKIM verified)
        const verifiedDomains = loadedDomains.filter(
          (d) =>
            d.verificationStatus === "verified" && d.dkimStatus === "verified"
        );

        let domainToSelect = initialDomainId;

        // If no domainId in URL, select the first verified domain as default
        if (!initialDomainId && verifiedDomains.length > 0) {
          // Select the first verified domain (most recently created)
          domainToSelect = verifiedDomains[0].id;
          console.log(
            `No domain in URL, selecting default verified domain: ${domainToSelect}`
          );
        }

        // If initialDomainId is provided, validate it exists
        if (initialDomainId && loadedDomains.length > 0) {
          const domainExists = loadedDomains.some(
            (d) => d.id === initialDomainId
          );
          if (!domainExists) {
            // Domain from URL doesn't exist, use default verified domain
            console.warn(
              `Domain ${initialDomainId} from URL not found. Using default domain.`
            );
            domainToSelect =
              verifiedDomains.length > 0 ? verifiedDomains[0].id : "";
          }
        }

        // Update state and URL with selected domain
        if (domainToSelect) {
          setState((prev) => ({ ...prev, domainId: domainToSelect }));
          // Update URL to include domainId if it's not already there or if it changed
          const params = new URLSearchParams(searchParams.toString());
          if (params.get("domainId") !== domainToSelect) {
            params.set("domainId", domainToSelect);
            router.replace(`/email/campaigns/builder?${params.toString()}`, {
              scroll: false,
            });
          }
        } else if (initialDomainId) {
          // No verified domains available, clear the invalid domain from URL
          const params = new URLSearchParams(searchParams.toString());
          params.delete("domainId");
          router.replace(`/email/campaigns/builder?${params.toString()}`, {
            scroll: false,
          });
        }
      } catch (error: any) {
        toast.error("Failed to initialize campaign builder");
        console.error(error);
      } finally {
        setLoadingDomains(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all verified senders from all domains (for multi-domain rotation)
  useEffect(() => {
    fetchAllSenders();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLists = async () => {
      setLoadingLists(true);
      try {
        const listsRes = await getLists(1, 100);
        if (!cancelled) {
          setListOptions(listsRes.data?.lists || []);
        }
      } catch (e) {
        console.error("Failed to load email lists:", e);
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    };
    loadLists();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resume a draft / scheduled / failed campaign from ?id= (same flow as new campaign, optional skip verify).
  // For sequence campaigns, ?liveSequenceEdit=1 also allows editing while status is "sending".
  useEffect(() => {
    if (!state.domainId || !effectiveCampaignId) return;
    let cancelled = false;
    const load = async () => {
      setLoadingExistingCampaign(true);
      try {
        const c = await getCampaignById(state.domainId, effectiveCampaignId);
        if (cancelled) return;

        if (c.status === "verifying_leads") {
          toast.error(
            "This campaign is still verifying leads. Check the campaign page for status.",
            { duration: 9000 }
          );
          return;
        }

        if (c.status === "verification_failed") {
          const raw = c as unknown as {
            reoonVerificationSummary?: { errorMessage?: string };
          };
          const errMsg = raw.reoonVerificationSummary?.errorMessage;
          toast.error(
            errMsg
              ? `Lead verification failed: ${errMsg}`
              : "Lead verification failed. You can edit recipients and try sending again, or retry verification from the campaign page.",
            { duration: 14000 }
          );
        }

        if (c.status === "completed") {
          toast.error(
            "This campaign is completed. Open the campaign page to view progress.",
            { duration: 8000 }
          );
          return;
        }
        if (c.status === "sending" && !canResumeSendingCampaign) {
          toast.error(
            "This campaign is currently sending. Use Edit sequence from the analytics page to modify pending recipients only.",
            { duration: 9000 }
          );
          return;
        }
        if (c.status === "sending" && canResumeSendingCampaign) {
          toast.success(
            "Live sequence edit mode: sent recipients stay locked, only pending recipients/new leads are updated.",
            { duration: 7000 }
          );
        }

        const seq = c.sequence?.[0];
        const loadedSteps: CampaignSequenceStep[] =
          (c.sequence || []).map((step, index) => {
            const stepAny = step as {
              delayMinutes?: number;
              previewText?: string;
              bodyEditor?: "simple" | "html";
              useSpintax?: boolean;
              spintaxPackId?: SpintaxPackId;
              strictGrammarMode?: boolean;
              body?: string;
              subject?: string;
            };
            return {
              id: `step-${index + 1}`,
              delayDays: Math.max(
                0,
                Math.round(Number(stepAny.delayMinutes || 0) / 1440)
              ),
              subject: stepAny.subject || "",
              body: stepAny.body || "",
              previewText: stepAny.previewText || "",
              condition: (stepAny as any).condition || "always",
              bodyEditor: stepAny.bodyEditor === "html" ? "html" : "simple",
              useSpintax: Boolean(stepAny.useSpintax),
              spintaxPackId: stepAny.spintaxPackId || "general",
              strictGrammarMode: Boolean(stepAny.strictGrammarMode),
            };
          }) || [];
        const nextSteps = loadedSteps.length > 0 ? loadedSteps : createDefaultSequenceSteps();
        const normalizedSteps = isSequenceMode ? nextSteps : nextSteps.slice(0, 1);
        const seqEx = seq as
          | {
              previewText?: string;
              bodyEditor?: string;
              useSpintax?: boolean;
              spintaxPackId?: SpintaxPackId;
              strictGrammarMode?: boolean;
            }
          | undefined;
        const rawC = c as unknown as {
          description?: string;
          dailySendTime?: string;
          replyTo?: string;
          leadIds?: string[];
          reoonVerificationSummary?: { verificationJobFailed?: boolean };
        };

        const loadedBody = seq?.body != null ? String(seq.body) : "";
        const hasBody = loadedBody.trim().length > 0;

        const explicitEditor = seqEx?.bodyEditor;
        const resolvedBodyEditor: "simple" | "html" =
          explicitEditor === "html"
            ? "html"
            : explicitEditor === "simple"
              ? "simple"
              : inferBodyEditorFromHtml(loadedBody);

        setState((prev) => ({
          ...prev,
          campaignName: c.name || prev.campaignName,
          campaignDescription: rawC.description || prev.campaignDescription,
          sequenceSteps: normalizedSteps,
          emailTemplate: syncPrimaryTemplate(normalizedSteps, {
            ...prev.emailTemplate,
            subject: seq?.subject || prev.emailTemplate.subject,
            previewText: seqEx?.previewText ?? prev.emailTemplate.previewText,
            htmlContent: loadedBody || prev.emailTemplate.htmlContent,
            bodyEditor: resolvedBodyEditor,
            useSpintax: Boolean(seqEx?.useSpintax),
            spintaxPackId: seqEx?.spintaxPackId || "general",
            strictGrammarMode: Boolean(seqEx?.strictGrammarMode),
            emailBodyInitialized: hasBody,
          }),
          dailySendTime: rawC.dailySendTime || prev.dailySendTime,
          replyTo: rawC.replyTo || prev.replyTo,
          useReplyTo: Boolean(rawC.replyTo),
          senderIds: c.senderId ? [String(c.senderId)] : prev.senderIds,
          selectedRecipients: {
            type: "individual",
            ids: Array.isArray(rawC.leadIds) ? rawC.leadIds.map(String) : [],
            count: Array.isArray(rawC.leadIds) ? rawC.leadIds.length : 0,
          },
        }));
        setSelectedSequenceStepId(normalizedSteps[0]?.id || "step-1");

        setResumeCampaignId(effectiveCampaignId);
        const summary = rawC.reoonVerificationSummary;
        const skipVerify =
          c.status === "scheduled" ||
          c.status === "sending" ||
          (c.status === "draft" &&
            Array.isArray(rawC.leadIds) &&
            rawC.leadIds.length > 0 &&
            summary &&
            !summary.verificationJobFailed);
        setResumeSkipVerification(Boolean(skipVerify));
      } catch (e) {
        console.error(e);
        toast.error("Could not load this campaign for editing.");
      } finally {
        if (!cancelled) setLoadingExistingCampaign(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [state.domainId, effectiveCampaignId, canResumeSendingCampaign]);

  // Send activity (today / yesterday / by day) when editing or viewing a campaign by id
  useEffect(() => {
    if (!effectiveCampaignId) {
      setSendVolume(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setSendVolumeLoading(true);
      try {
        const res = await emailClient.get(
          `/api/analytics/campaigns/${effectiveCampaignId}/analytics`
        );
        const vol = res.data?.data?.sendVolume as CampaignSendVolume | undefined;
        if (!cancelled && vol && typeof vol.sentToday === "number") {
          setSendVolume(vol);
        } else if (!cancelled) {
          setSendVolume(null);
        }
      } catch {
        // Keep previous sendVolume on transient errors
      } finally {
        if (!cancelled) setSendVolumeLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [effectiveCampaignId]);

  // Clear sender selections when domain changes
  useEffect(() => {
    const currentDomainId = state.domainId;
    const previousDomainId = prevDomainIdRef.current;

    // Only clear if domainId actually changed and is not empty
    if (
      currentDomainId &&
      currentDomainId !== previousDomainId &&
      previousDomainId
    ) {
      setState((prev) => ({
        ...prev,
        senderIds: [],
      }));
    }

    // Update the ref to track the current domainId
    prevDomainIdRef.current = currentDomainId;
  }, [state.domainId]);

  const fetchAllSenders = async () => {
    try {
      setLoadingSenders(true);
      const response = await emailClient.get("/api/email-senders", {
        params: { page: 1, limit: 100 },
      });
      const allSenders = response.data?.data?.senders || [];
      // Filter only verified senders (from any domain)
      const verifiedSenders = allSenders.filter(
        (sender: EmailSender) => sender.verificationStatus === "verified"
      );

      // Fetch quota for each verified sender
      const sendersWithQuota = await Promise.all(
        verifiedSenders.map(async (sender: EmailSender) => {
          try {
            const quotaResponse = await emailClient.get(
              `/api/email-senders/${sender.id}/quota`
            );
            if (quotaResponse.data.success) {
              return {
                ...sender,
                quota: quotaResponse.data.data,
              };
            }
          } catch (error) {
            console.warn(
              `Failed to fetch quota for sender ${sender.id}:`,
              error
            );
          }
          return sender;
        })
      );

      setSenders(sendersWithQuota);
    } catch (error: any) {
      toast.error("Failed to fetch email senders");
      console.error(error);
    } finally {
      setLoadingSenders(false);
    }
  };

  // Calculate rotation distribution
  const calculateRotation = () => {
    if (state.senderIds.length === 0 || state.selectedRecipients.count === 0) {
      return null;
    }

    const selectedSenders = senders.filter((s) =>
      state.senderIds.includes(s.id)
    );
    const leadCount = state.selectedRecipients.count;

    if (selectedSenders.length === 0 || leadCount === 0) {
      return null;
    }

    // Use sender dailyCap / remaining quota as weights for proportional distribution.
    // We intentionally DO NOT hard-cap by today's capacity, so that all leads are
    // assigned to senders and overflow is naturally spread across multiple days
    // by the backend warmup/quota logic.
    // BYO SES: no artificial minimum weight — senders without a configured cap contribute 0.
    const weightedSenders = selectedSenders.map((sender) => {
      if (sesProvider === "custom") {
        const cap =
          sender.quota?.dailyCap || sender.quota?.remaining || 0;
        return { sender, weight: Math.max(0, cap) };
      }
      const cap =
        sender.quota?.dailyCap ||
        sender.quota?.remaining ||
        1; // ensure every sender has at least minimal weight
      return {
        sender,
        weight: Math.max(1, cap),
      };
    });

    const totalWeight = weightedSenders.reduce(
      (sum, w) => sum + w.weight,
      0
    );

    if (totalWeight === 0) {
      return {
        distribution: weightedSenders.map((w) => ({ sender: w.sender, leads: 0 })),
        totalCapacity: 0,
        canSend: false,
        excess: leadCount,
      };
    }

    // First pass: proportional allocation based on weights
    let remainingLeads = leadCount;
    const provisional = weightedSenders.map((w) => {
      const raw = (leadCount * w.weight) / totalWeight;
      const assigned = Math.floor(raw);
      remainingLeads -= assigned;
      return {
        sender: w.sender,
        leads: assigned,
        fractional: raw - assigned,
      };
    });

    // Second pass: assign remaining leads to senders with largest fractional remainder
    if (remainingLeads > 0) {
      provisional
        .sort((a, b) => b.fractional - a.fractional)
        .forEach((entry) => {
          if (remainingLeads <= 0) return;
          entry.leads += 1;
          remainingLeads -= 1;
        });
    }

    const distribution = provisional.map(({ sender, leads }) => ({
      sender,
      leads,
    }));

    const totalAssigned = distribution.reduce(
      (sum, d) => sum + d.leads,
      0
    );

    // For multi-day sending we only require that all leads are assigned and that
    // there is some positive daily capacity across senders.
    const totalCapacity = weightedSenders.reduce(
      (sum, w) =>
        sum +
        (w.sender.quota?.remaining || w.sender.quota?.dailyCap || 0),
      0
    );

    return {
      distribution,
      totalCapacity,
      canSend: totalAssigned === leadCount && totalCapacity > 0,
      excess: 0,
    };
  };

  const rotation = calculateRotation();

  /** Only show daily send window when this campaign cannot complete today (overflow to next day). */
  const showDailySendWindow =
    !!rotation &&
    state.selectedRecipients.count > 0 &&
    state.selectedRecipients.count > rotation.totalCapacity;

  // Approximate warmup ramp used ONLY for UI forecasting.
  // Backend ultimately enforces the true per-sender cap via reputationService.
  const NEW_DOMAIN_RAMPUP: [number, number][] = [
    // Domain age (days) -> max emails per day:
    // 0-1: 20, 2: 25, 3: 30, 4: 40, 5: 50,
    // 6: 70, 7: 100, 8: 120, 9: 150, 10: 180, 11+: 200
    [11, 200],
    [10, 180],
    [9, 150],
    [8, 120],
    [7, 100],
    [6, 70],
    [5, 50],
    [4, 40],
    [3, 30],
    [2, 25],
    [0, 20],
  ];

  const WARMING_DOMAIN_RAMPUP: [number, number][] = [
    [60, 2000],
    [30, 1000],
    [21, 500],
    [14, 200],
    [0, 100],
  ];

  const getCapFromRampTable = (
    ageInDays: number,
    table: [number, number][]
  ): number => {
    for (const [minDay, cap] of table) {
      if (ageInDays >= minDay) return cap;
    }
    return table[table.length - 1][1];
  };

  const estimateSenderDailyCapForDayOffset = (
    sender: EmailSender,
    dayOffset: number
  ): number => {
    if (!sender.quota) return 0;
    const { dailyCap, remaining } = sender.quota;

    // Start from the actual backend-exposed cap for this sender.
    const baseCap = dailyCap || remaining || 0;
    if (baseCap <= 0) return 0;

    // BYO SES: no LeadSnipper reputation warmup forecast — use your effective cap each day.
    if (sesProvider === "custom") {
      return baseCap;
    }

    const maxCap = 200;

    // Day 0 (today): never exceed the current cap.
    if (dayOffset === 0) {
      return Math.min(baseCap, maxCap);
    }

    // Growth factor based on current level:
    // - small caps grow by ~10% per active day
    // - mid caps by ~15%
    // - higher caps by ~20%
    const growthRate =
      baseCap < 50 ? 0.15 : baseCap < 100 ? 0.20 : 0.25;

    let cap = baseCap;
    for (let i = 0; i < dayOffset; i++) {
      cap = Math.min(maxCap, Math.round(cap * (1 + growthRate)));
      if (cap >= maxCap) break;
    }

    return cap;
  };

  const computeScheduleEstimate = () => {
    if (!rotation) return null;

    const leadCount = state.selectedRecipients.count;
    if (leadCount <= 0) return null;

    // Build a simple forecast using backend-like warmup logic per sender.
    // We don't try to predict reputation changes, just the domain-based ramp.
    const maxDays = 90; // hard cap to avoid huge arrays
    const breakdown: { day: number; count: number }[] = [];
    let remaining = leadCount;
    let dayIndex = 0;

    while (remaining > 0 && dayIndex < maxDays) {
      const dayOffset = dayIndex; // 0 = today,
      const dailyCapTotal = rotation.distribution.reduce((sum, dist) => {
        return (
          sum + estimateSenderDailyCapForDayOffset(dist.sender, dayOffset)
        );
      }, 0);

      if (dailyCapTotal <= 0) {
        // No capacity at all; stop to avoid infinite loop
        break;
      }

      const todaySend = Math.min(dailyCapTotal, remaining);
      breakdown.push({ day: dayIndex + 1, count: todaySend });
      remaining -= todaySend;
      dayIndex += 1;
    }

    if (breakdown.length === 0) return null;

    const estimatedDays = breakdown.length;

    return { estimatedDays, breakdown, remaining };
  };

  const scheduleEstimate = computeScheduleEstimate();

  // Validation helpers
  const sequenceHasAllRequiredFields = isSequenceMode
    ? state.sequenceSteps.length > 0 &&
      state.sequenceSteps.every(
        (step) => step.subject.trim().length > 0 && step.body.trim().length > 0
      )
    : (state.sequenceSteps[0]?.subject?.trim().length || 0) > 0 &&
      (state.sequenceSteps[0]?.body?.trim().length || 0) > 0;

  const buildSequencePayload = () =>
    (isSequenceMode
      ? state.sequenceSteps
      : [state.sequenceSteps[0] || createDefaultSequenceSteps()[0]]
    ).map((step) => ({
      subject: step.subject,
      previewText: step.previewText || "",
      condition: step.condition || "always",
      body: step.body,
      delayMinutes: isSequenceMode
        ? Math.max(0, Number(step.delayDays || 0)) * 1440
        : 0,
      replyTo: state.useReplyTo && state.replyTo ? state.replyTo : undefined,
      bodyEditor: step.bodyEditor,
      useSpintax: step.useSpintax,
      spintaxPackId: step.spintaxPackId,
      strictGrammarMode: step.strictGrammarMode,
    }));

  const validation = {
    recipients: state.selectedRecipients.count > 0,
    subject: sequenceHasAllRequiredFields,
    content: sequenceHasAllRequiredFields,
    campaignName: state.campaignName.trim().length > 0,
    domain: state.domainId.length > 0,
    sender: state.senderIds.length > 0,
    // Capacity now means: "do selected senders have *any* daily capacity so we can start?"
    // We allow campaigns that will take multiple days; backend warmup handles pacing.
    capacity:
      rotation && typeof rotation.totalCapacity === "number"
        ? rotation.totalCapacity > 0
        : false,
  };

  const isFormValid = Object.values(validation).every((v) => v === true);
  const isLiveSequenceResume = Boolean(resumeCampaignId) && canResumeSendingCampaign;

  const handleRecipientsSelected = (data: {
    type: "list" | "filter" | "individual" | "csv";
    ids: string[];
    count: number;
    csvData?: Array<Record<string, string>>;
    columns?: string[];
    emailColumn?: string;
    csvUploadNote?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      selectedRecipients: {
        type: data.type,
        ids: data.ids,
        count: data.count,
      },
      csvData: data.csvData || prev.csvData,
      columns: data.columns || prev.columns,
      emailColumn: data.emailColumn || prev.emailColumn,
      csvUploadNote: data.type === "csv" ? (data.csvUploadNote ?? prev.csvUploadNote) : undefined,
      selectedLists: data.type === "csv" ? prev.selectedLists : [],
    }));
    setShowRecipientModal(false);
  };

  const finalizeCampaignSend = async (campaignId: string, idsToUse: string[]) => {
    const domainId = state.domainId;
    toast.loading("Saving campaign…");
    try {
      await emailClient.patch(`/api/domains/${domainId}/campaigns/${campaignId}`, {
        sequence: buildSequencePayload(),
      });
    } catch (patchErr: unknown) {
      toast.dismiss();
      const errorMsg = getEmailServiceErrorMessage(
        patchErr,
        "Could not save campaign content"
      );
      toast.error(errorMsg, { duration: 8000 });
      throw patchErr;
    }

    toast.dismiss();
    toast.loading("Adding leads to campaign...");

    try {
      await emailClient.post(
        `/api/domains/${domainId}/campaigns/${campaignId}/add-leads`,
        {
          leadIds: idsToUse,
        }
      );

      toast.dismiss();
      toast.success("Leads added to campaign successfully!");
    } catch (addLeadsError: any) {
      toast.dismiss();
      const errorMsg =
        addLeadsError.response?.data?.message ||
        addLeadsError.message ||
        "Failed to add leads to campaign";
      toast.error(errorMsg);
      console.error("Add leads error:", addLeadsError);
      throw addLeadsError;
    }

    if (
      state.useAttachment &&
      state.emailTemplate.attachments &&
      state.emailTemplate.attachments.length > 0
    ) {
      toast.loading("Uploading attachment...");
      try {
        const attachment = state.emailTemplate.attachments[0];
        const fileBuffer = await attachment.file.arrayBuffer();
        const bytes = new Uint8Array(fileBuffer);
        const binary = bytes.reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        );
        const base64 = btoa(binary);

        const uploadResponse = await emailClient.post(
          `/api/domains/${domainId}/campaigns/${campaignId}/upload-attachment`,
          {
            fileBuffer: base64,
            fileName: attachment.name,
            mimeType: attachment.type,
          }
        );

        const uploadData = uploadResponse.data?.data;
        if (!uploadData?.s3Key) {
          throw new Error("Failed to get s3Key from upload response");
        }

        await emailClient.patch(
          `/api/domains/${domainId}/campaigns/${campaignId}`,
          {
            attachment: {
              s3Key: uploadData.s3Key,
              fileName: uploadData.fileName || attachment.name,
              mimeType: uploadData.mimeType || attachment.type,
              size: uploadData.size || attachment.size,
            },
          }
        );

        toast.dismiss();
        toast.success("Attachment uploaded successfully!");
      } catch (attachmentError: any) {
        toast.dismiss();
        console.error("Attachment upload error:", attachmentError);
        toast.error(
          attachmentError.response?.data?.message ||
            "Failed to upload attachment"
        );
      }
    }

    toast.loading(`Sending campaign...`);

    const primarySenderId = state.senderIds[0];
    if (!primarySenderId) {
      toast.dismiss();
      toast.error("No sender selected");
      throw new Error("No sender selected");
    }

    const sendResponse = await emailClient.post(
      `/api/domains/${domainId}/campaigns/${campaignId}/send`,
      {
        senderId: primarySenderId,
        senderIds: state.senderIds,
        rotationDistribution: rotation?.distribution.map((d) => ({
          senderId: d.sender.id,
          leadCount: d.leads,
        })),
        dailySendTime: state.dailySendTime || undefined,
      }
    );

    if (sendResponse.data?.success) {
      const sentCount =
        sendResponse.data?.data?.sentCount || idsToUse.length;
      toast.dismiss();
      toast.success(
        `Campaign sent successfully to ${sentCount} recipients!`
      );
      if (onSuccess) onSuccess();
    } else {
      toast.dismiss();
      toast.error("Failed to send campaign");
    }
  };

  const handleSend = async () => {
    if (!validation.recipients) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!validation.subject) {
      toast.error("Please fill subject for every sequence step");
      return;
    }
    if (!validation.content) {
      toast.error("Please fill email body for every sequence step");
      return;
    }
    if (!validation.campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }
    if (!validation.domain) {
      toast.error("Please select a domain");
      return;
    }
    if (!validation.sender) {
      toast.error("Please select at least one email sender");
      return;
    }
    if (!validation.capacity) {
      toast.error(
        sesProvider === "custom"
          ? `Your selected senders have no daily send cap configured (or capacity is zero). Set a daily send cap per sender under Email → Domains → Senders.`
          : `Your selected senders have no daily sending capacity. Please warm up senders or add more senders.`
      );
      return;
    }

    try {
      const reoonStatus = await getReoonStatus();
      if (!reoonStatus.isConfigured) {
        setShowReoonKeyRequiredModal(true);
        return;
      }
    } catch (reoonErr: any) {
      toast.error(
        reoonErr?.response?.data?.message ||
          reoonErr?.message ||
          "Could not verify Reoon setup. Try again."
      );
      return;
    }

    setSending(true);

    try {
      let leadIds: string[] = [];

      if (state.selectedRecipients.type === "csv" && state.csvData.length > 0) {
        toast.loading(`Creating ${state.csvData.length} leads...`);

        try {
          const csvDataForApi = state.csvData.map((row: any) => {
            if (state.emailColumn && state.emailColumn !== "email") {
              return { ...row, email: row[state.emailColumn] };
            }
            return row;
          });

          const leadsResponse = await emailClient.post(
            `/api/domains/${state.domainId}/campaigns/leads/create-from-csv`,
            {
              csvData: csvDataForApi,
              tagIds: state.selectedTags?.map((t: any) => String(t.id)) || [],
              categoryIds:
                state.selectedCategories?.map((c: any) => String(c.id)) || [],
              listIds:
                state.selectedLists
                  ?.map((l) => String(l.id))
                  .filter(
                    (id) => id.length > 0 && id !== "undefined" && id !== "null"
                  ) || [],
            }
          );

          leadIds = leadsResponse.data?.data?.leadIds || [];

          if (leadIds.length === 0) {
            toast.dismiss();
            toast.error("Failed to create leads from CSV");
            return;
          }

          toast.dismiss();
        } catch (csvError: any) {
          toast.dismiss();
          const errorMsg = getEmailServiceErrorMessage(
            csvError,
            "Failed to create leads from CSV"
          );
          toast.error(errorMsg, { duration: 8000 });
          console.error("CSV creation error:", csvError);
          return;
        }
      } else {
        leadIds = state.selectedRecipients.ids;
      }

      const usingNewCsv =
        state.selectedRecipients.type === "csv" && state.csvData.length > 0;

      if (resumeCampaignId && resumeSkipVerification && !usingNewCsv) {
        if (leadIds.length === 0) {
          toast.error(
            "No recipients on this campaign. Select recipients or add leads first."
          );
          return;
        }
        await finalizeCampaignSend(resumeCampaignId, leadIds);
        return;
      }

      if (leadIds.length === 0) {
        toast.error(
          "No recipients found to queue. Select recipients and try again."
        );
        return;
      }

      // Keep the send-time Reoon check strict, but avoid bulk pre-verification.
      // The worker verifies one lead at a time and naturally fills each day's sender quota.
      const refreshed = await getReoonStatus(true);
      const daily = refreshed.lastBalanceDailyCredits ?? 0;
      const instant = refreshed.lastBalanceInstantCredits ?? 0;
      if (daily + instant < 1) {
        toast.error(
          "You ran out of credits on Reoon. Add credits or update your API key in Settings → Integrations, then refresh and try again.",
          { duration: 10000 }
        );
        return;
      }

      toast.loading("Creating and queueing campaign...");
      try {
        const primarySenderId = state.senderIds[0];
        if (!primarySenderId) {
          toast.dismiss();
          toast.error("No sender selected");
          return;
        }

        const response = await emailClient.post(
          `/api/domains/${state.domainId}/campaigns/send`,
          {
            campaignType: isSequenceMode ? "sequence" : "single",
            name: state.campaignName,
            description: state.campaignDescription,
            sequence: buildSequencePayload(),
            leadIds,
            tags: state.selectedTags?.map((t: any) => t.name) || [],
            send: {
              senderId: primarySenderId,
              senderIds: state.senderIds,
              rotationDistribution: rotation?.distribution.map((d) => ({
                senderId: d.sender.id,
                leadCount: d.leads,
              })),
              dailySendTime: state.dailySendTime || undefined,
            },
          }
        );

        toast.dismiss();
        if (response.data?.success) {
          const queuedCount = response.data?.data?.queuedCount || leadIds.length;
          toast.success(`Campaign queued successfully for ${queuedCount} emails!`);
          if (onSuccess) onSuccess();
          return;
        }
        toast.error("Failed to create and send campaign");
      } catch (campaignError: any) {
        toast.dismiss();
        const errorMsg = getEmailServiceErrorMessage(
          campaignError,
          "Failed to create and send campaign"
        );
        toast.error(errorMsg, { duration: 8000 });
        throw campaignError;
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(
        error?.response?.data?.message || "Failed to send campaign"
      );
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleAIGenerated = (data: AIGeneratedCampaignResponse) => {
    const sorted = [...(data.emails || [])].sort((a, b) => a.step - b.step);
    const firstEmail = sorted.find((e) => e.step === 1) || sorted[0];
    if (!firstEmail) {
      toast.error("AI response did not include any email variation");
      return;
    }

    const aiSteps: CampaignSequenceStep[] = isSequenceMode
      ? sorted.map((email, index) => ({
          id: `step-${index + 1}`,
          delayDays: DEFAULT_STEP_DELAYS[index] ?? index * 2,
          subject: email.subject || "",
          body: email.body || "",
          previewText: email.preview_line || data.preview_lines?.[index] || "",
          condition: index === 0 ? "always" : "if_not_replied",
          bodyEditor: "simple",
          useSpintax: false,
          spintaxPackId: "general",
          strictGrammarMode: false,
        }))
      : [{
          id: "step-1",
          delayDays: 0,
          subject: firstEmail.subject || "",
          body: firstEmail.body || "",
          previewText: firstEmail.preview_line || data.preview_lines?.[0] || "",
          condition: "always",
          bodyEditor: "simple",
          useSpintax: false,
          spintaxPackId: "general",
          strictGrammarMode: false,
        }];
    const nextSteps = aiSteps.length > 0 ? aiSteps : createDefaultSequenceSteps().slice(0, isSequenceMode ? 4 : 1);

    setAiGeneratedData(data);

    setState((prev) => ({
      ...prev,
      campaignName: data.campaign_name || prev.campaignName,
      campaignDescription:
        data.campaign_description?.trim() || prev.campaignDescription,
      sequenceSteps: nextSteps,
      emailTemplate: syncPrimaryTemplate(nextSteps, prev.emailTemplate),
    }));
    setSelectedSequenceStepId(nextSteps[0]?.id || "step-1");
  };

  const handleClearAIGenerated = () => {
    setAiGeneratedData(null);
  };

  const handleSelectAIEmailStep = (step: AIGeneratedCampaignEmailStep) => {
    updateSequenceSteps((steps) => {
      const targetId = isSequenceMode ? (selectedSequenceStepId || steps[0]?.id) : "step-1";
      return steps.map((current) =>
        current.id === targetId
          ? {
              ...current,
              subject: step.subject,
              body: step.body,
              previewText: step.preview_line?.trim() || "",
              condition: current.condition || "always",
              bodyEditor: "simple",
              useSpintax: false,
              spintaxPackId: "general",
              strictGrammarMode: false,
            }
          : current
      );
    });
  };

  // Extract variables from CSV columns
  const INTERNAL_FIELDS = [
    "id",
    "lead_id",
    "user_id",
    "created_at",
    "updated_at",
    "campaign_id",
    "category_id",
    "status",
    "enriched_data",
    "bounce_reason",
    "complaint_reason",
    "unsubscribe_reason",
    "last_email_sent_at",
    "last_interaction_at",
  ];

  const availableVariables = state.columns
    .filter((e) => e !== "__EMPTY")
    .filter((e) => !INTERNAL_FIELDS.includes(e.toLowerCase()))
    .map((e) => `{{${e.trim()}}}`);

  const selectedStep =
    state.sequenceSteps.find((step) => step.id === selectedSequenceStepId) ??
    state.sequenceSteps[0] ??
    null;
  const previewStep = previewStepId
    ? state.sequenceSteps.find((step) => step.id === previewStepId) ?? null
    : null;

  const applySelectedStepFromModal = (payload: {
    subject: string;
    previewText: string;
    htmlContent: string;
    bodyEditor: "simple" | "html";
    useSpintax: boolean;
    spintaxPackId: SpintaxPackId;
    strictGrammarMode: boolean;
  }) => {
    const targetStepId = selectedStep?.id;
    if (!targetStepId) return;
    updateSequenceSteps((steps) =>
      steps.map((step) =>
        step.id === targetStepId
          ? {
              ...step,
              subject: payload.subject,
              previewText: payload.previewText,
              body: payload.htmlContent,
              bodyEditor: payload.bodyEditor,
              useSpintax: payload.useSpintax,
              spintaxPackId: payload.spintaxPackId,
              strictGrammarMode: payload.strictGrammarMode,
            }
          : step
      )
    );
  };

  if (loadingExistingCampaign && effectiveCampaignId) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-main mx-auto mb-3" />
          <p className="text-text-200 text-sm">Loading campaign…</p>
        </div>
      </div>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <div className="backdrop-blur-xl bg-brand-main/10 border border-brand-main/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-text-100 mb-2">
              You&apos;re almost ready to send
            </h2>
            <p className="text-text-200 mb-6">
              {eligibility.ineligibleReason
                ? eligibility.ineligibleReason
                : "To build a campaign, you&apos;ll need at least one verified domain with DKIM and one verified sender."}
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto mb-6">
              {eligibility.ineligibleReason && (
                <p className="text-text-200">
                  <a
                    href="/email/settings"
                    className="text-brand-main hover:underline font-medium"
                  >
                    Go to Settings → Email delivery
                  </a>{" "}
                  to connect your AWS SES credentials.
                </p>
              )}
              {!eligibility.ineligibleReason && eligibility.verifiedDomainCount === 0 && (
                <p className="text-text-200">
                  • No verified domains found. Verify your domain first.
                </p>
              )}
              {!eligibility.ineligibleReason && eligibility.verifiedSenderCount === 0 && (
                <p className="text-text-200">
                  • No verified senders found. Add and verify a sender.
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() =>
                  window.location.href = eligibility.ineligibleReason
                    ? "/email/settings"
                    : "/email/domains"
                }
                className="px-4 py-2 rounded-lg bg-brand-main text-text-100"
              >
                {eligibility.ineligibleReason ? "Settings" : "Manage Domains"}
              </Button>
              {!eligibility.ineligibleReason && (
                <Button
                  onClick={() => (window.location.href = "/email/domains")}
                  className="px-4 py-2 rounded-lg bg-brand-main/20 text-text-100 border border-brand-main/30"
                >
                  Add Sender
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_45%),radial-gradient(circle_at_top_left,_rgba(34,197,94,0.06),_transparent_35%)] bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowDiscardModal(true)}
                className="inline-flex items-center rounded-md px-1 text-[11px] font-medium text-text-200 transition hover:text-text-100"
              >
                Campaigns / Create Campaign
              </button>
              <p className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-blue-700">
                {isSequenceMode ? "Sequence Builder" : "Single Campaign Builder"}
              </p>
              <h1 className="text-lg font-bold leading-tight text-text-100 sm:text-[22px]">
                Create New Campaign
              </h1>
              <p className="text-xs text-text-200 sm:text-[13px]">
                Simple flow, clear value, and launch-ready outreach in one place.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  1. Pick recipients
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  2. Write message
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  3. Configure senders
                </span>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={() => setShowDiscardModal(true)}
                className="rounded-xl border border-slate-200 p-1.5 text-text-200 transition hover:bg-slate-100 hover:text-text-100"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - All sections visible */}
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {isLiveSequenceResume && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Live Sequence Edit
            </p>
            <p className="mt-1 text-sm text-blue-900">
              Sent emails stay immutable. Your updates apply to pending recipients and any newly
              added leads only.
            </p>
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              validation.recipients ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            Recipients
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              validation.subject && validation.content
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Content
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              validation.campaignName && validation.sender
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Settings
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              isFormValid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isFormValid ? "Ready to launch" : "Action required"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Section 1: Recipients */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.recipients
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.recipients ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Users size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Recipients
                    </h2>
                    <p className="text-xs text-text-200">
                      Choose exactly who should receive this campaign.
                    </p>
                  </div>
                </div>
                {!validation.recipients && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              {state.selectedRecipients.count > 0 ? (
                <>
                  <div className="bg-success/10 border-2 border-success/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={16} className="text-success" />
                          <p className="font-semibold text-sm text-text-100">
                            {state.selectedRecipients.count} recipient
                            {state.selectedRecipients.count !== 1 ? "s" : ""}{" "}
                            selected
                          </p>
                        </div>
                        <p className="text-xs text-text-200">
                          Type: {state.selectedRecipients.type}
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowRecipientModal(true)}
                        variant="outline"
                        className="border-brand-main/20 text-xs px-3 py-1.5"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                  {state.csvUploadNote && (
                    <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-3 mb-3">
                      <p className="text-xs text-text-200">
                        {state.csvUploadNote}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-text-200/80 mb-3">
                    Recipients are verified with Reoon before sending. Unverified addresses are checked automatically when you send; the campaign stays in Verifying leads until that finishes.
                  </p>
                </>
              ) : (
                <div className="border-2 border-dashed border-brand-main/20 rounded-lg p-6 text-center mb-3">
                  <Users size={40} className="mx-auto text-text-200/40 mb-3" />
                  <p className="text-sm text-text-200 mb-3">
                    No recipients selected
                  </p>
                  <Button
                    onClick={() => setShowRecipientModal(true)}
                    className="bg-brand-main hover:bg-brand-main/90 text-white text-sm px-4 py-2"
                  >
                    Select Recipients
                  </Button>
                </div>
              )}
            </div>

            {state.selectedRecipients.type === "csv" &&
              state.selectedRecipients.count > 0 && (
                <div className="backdrop-blur-xl bg-brand-main/5 border border-brand-main/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-text-100 mb-1">
                    Lists for new contacts
                  </h3>
                  <p className="text-xs text-text-200 mb-3">
                    Optional. Leads created from your CSV will be linked to these
                    lists (same as bulk upload on the Leads page).
                  </p>
                  <CreatableSelect
                    options={listOptions.map((l) => ({
                      id: l.id,
                      name: l.name,
                    }))}
                    value={state.selectedLists}
                    onChange={(selected) =>
                      setState((prev) => ({
                        ...prev,
                        selectedLists: selected as EmailList[],
                      }))
                    }
                    onCreateNew={async (name: string) => {
                      const newList = await createList({ name });
                      setListOptions((prev) => [...prev, newList]);
                      return { id: newList.id, name: newList.name };
                    }}
                    placeholder="Select or create lists..."
                    label="Lists"
                    isMulti={true}
                    isLoading={loadingLists}
                  />
                </div>
              )}

            {/* Section 2: Email Content */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.subject && validation.content
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.subject && validation.content ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Mail size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Email Content
                    </h2>
                    <p className="text-xs text-text-200">
                      Keep your message clear, personalized, and conversion-focused.
                    </p>
                  </div>
                </div>
                {(!validation.subject || !validation.content) && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <Button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  variant="secondary"
                  className="group inline-flex h-auto w-full items-center justify-between gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm font-semibold text-text-100 shadow-sm transition-all hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-700 transition">
                    <Sparkles size={18} strokeWidth={2} />
                    </span>
                    <span className="text-left leading-tight">
                      {aiGeneratedData ? (
                        <>
                          <span className="block text-sm text-text-100">Generate new AI variation</span>
                          <span className="block pt-0.5 text-[11px] font-normal text-text-200">
                            Replace subject, preview, and body draft
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block text-sm text-text-100">Generate with AI</span>
                          <span className="block pt-0.5 text-[11px] font-normal text-text-200">
                            Draft subject line, preview text, and full email
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="rounded-md border border-blue-200 bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">
                    {aiGeneratedData ? "Regenerate" : "AI Draft"}
                  </span>
                </Button>
              </div>

              {aiGeneratedData ? (
                <AIGeneratedCampaignPanel
                  data={aiGeneratedData}
                  editorBody={
                    state.sequenceSteps[0]?.body || ""
                  }
                  onSelectEmailStep={handleSelectAIEmailStep}
                  onClear={handleClearAIGenerated}
                />
              ) : null}

              <div className="space-y-3">
                <div className="flex gap-2">
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-main/15 bg-brand-main/5 px-3 py-2">
                  <p className="text-xs text-text-200">
                    Personalization preview:{" "}
                    <span className="font-medium text-text-100">Hi John</span> (from{" "}
                    <span className="font-mono text-brand-main">{"{{first_name}}"}</span>)
                  </p>
                </div>

                {!isSequenceMode && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedSequenceStepId("step-1");
                        setSequenceEditorOpen(true);
                      }}
                    >
                      {state.sequenceSteps[0]?.body?.trim() || state.sequenceSteps[0]?.subject?.trim()
                        ? "Edit email"
                        : "Open editor"}
                    </Button>
                  </div>
                )}
</div>
                {isSequenceMode ? (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-100">Sequence canvas</p>
                          <p className="text-xs text-text-200">
                            Open the canvas modal to manage steps and template previews.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowSequenceCanvasModal(true)}
                        >
                          Open sequence canvas
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {state.sequenceSteps.map((step, index) => (
                        <button
                          key={`summary-${step.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedSequenceStepId(step.id);
                            setShowSequenceCanvasModal(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            Step {index + 1}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-text-100">
                            {step.subject || "Untitled subject"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-200">
                            Day {step.delayDays}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-text-200">
                            {step.previewText || step.body?.replace(/<[^>]+>/g, " ").trim() || "No content yet"}
                          </p>
                        </button>
                      ))}
                    </div>

                    {showSequenceCanvasModal && (
                      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
                        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                            <div>
                              <h3 className="text-base font-semibold text-text-100">Sequence Canvas</h3>
                              <p className="text-xs text-text-200">
                                Manage sequence flow and open template editor from here.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSequenceCanvasModal(false)}
                              className="rounded-lg p-2 text-text-200 transition hover:bg-slate-100 hover:text-text-100"
                              aria-label="Close sequence canvas modal"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="overflow-y-auto p-4">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-main" />
                          Sequence canvas
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          Sequence flow
                        </span>
                      </div>

                      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                          Start
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div className="space-y-4">
                        {state.sequenceSteps.map((step, index) => {
                          const isActive = selectedSequenceStepId === step.id;
                          const conditionLabel =
                            step.condition === "if_not_opened"
                              ? "If not opened"
                              : step.condition === "if_not_replied"
                              ? "If not replied"
                              : "Always continue";

                          return (
                            <div key={step.id} className="relative pl-12">
                              {index < state.sequenceSteps.length - 1 ? (
                                <div className="absolute left-[15px] top-9 h-[calc(100%+12px)] w-px bg-slate-300" />
                              ) : null}

                              <button
                                type="button"
                                onClick={() => setSelectedSequenceStepId(step.id)}
                                className={`absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition ${
                                  isActive
                                    ? "border-blue-300 bg-blue-100 text-blue-700"
                                    : "border-slate-300 bg-white text-slate-600 hover:border-blue-200"
                                }`}
                                aria-label={`Select sequence step ${index + 1}`}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </button>

                              <div
                                className={`overflow-hidden rounded-xl border bg-white transition ${
                                  isActive
                                    ? "border-blue-300 shadow-[0_10px_25px_-20px_rgba(37,99,235,0.8)]"
                                    : "border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-text-100">
                                      {step.subject || `Step ${index + 1} email`}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-text-200">
                                      Day {step.delayDays} • {conditionLabel}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewStepId(step.id)}
                                      className="rounded-md border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                      aria-label={`Preview step ${index + 1}`}
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <span
                                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                                        isActive
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {isActive ? "Active" : "Draft"}
                                    </span>
                                  </div>
                                </div>

                                {isActive ? (
                                  <div className="space-y-3 px-4 py-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-[11px] font-medium text-text-200">
                                          Delay (days)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={step.delayDays}
                                          onChange={(e) =>
                                            updateSequenceSteps((steps) =>
                                              steps.map((s) =>
                                                s.id === step.id
                                                  ? { ...s, delayDays: Number(e.target.value || 0) }
                                                  : s
                                              )
                                            )
                                          }
                                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main/30"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] font-medium text-text-200">
                                          Condition
                                        </label>
                                        <select
                                          value={step.condition || "always"}
                                          onChange={(e) =>
                                            updateSequenceSteps((steps) =>
                                              steps.map((s) =>
                                                s.id === step.id
                                                  ? {
                                                      ...s,
                                                      condition: e.target
                                                        .value as "always" | "if_not_opened" | "if_not_replied",
                                                    }
                                                  : s
                                              )
                                            )
                                          }
                                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main/30"
                                        >
                                          <option value="always">Always continue</option>
                                          <option value="if_not_opened">Only if not opened</option>
                                          <option value="if_not_replied">Only if not replied</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                        Template preview
                                      </p>
                                      <p className="mt-2 truncate text-sm font-semibold text-text-100">
                                        Subject: {step.subject || "Untitled"}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-text-200">
                                        {step.previewText || "No preview text set yet."}
                                      </p>
                                      <div className="mt-2 rounded-md border border-slate-200 bg-white p-2.5">
                                        {step.body?.trim() ? (
                                          step.bodyEditor === "html" || /<\/?[a-z][\s\S]*>/i.test(step.body) ? (
                                            <div
                                              className="max-h-44 overflow-hidden text-xs leading-relaxed text-text-100"
                                              dangerouslySetInnerHTML={{ __html: step.body }}
                                            />
                                          ) : (
                                            <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-text-100">
                                              {step.body}
                                            </p>
                                          )
                                        ) : (
                                          <p className="line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-text-100">
                                            No body yet. Open email editor to create this template.
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-text-200">
                                      Edit email content from the sequence email editor modal.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                                    <p className="truncate text-xs text-text-200">
                                      {step.previewText || "No preview text added yet."}
                                    </p>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedSequenceStepId(step.id)}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pl-12">
                        <button
                          type="button"
                          onClick={() =>
                            updateSequenceSteps((steps) => [
                              ...steps,
                              {
                                id: `step-${Date.now()}`,
                                delayDays: (steps[steps.length - 1]?.delayDays || 0) + 2,
                                subject: "",
                                previewText: "",
                                body: "",
                                condition: "if_not_replied",
                                bodyEditor: "simple",
                                useSpintax: false,
                                spintaxPackId: "general",
                                strictGrammarMode: false,
                              },
                            ])
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-medium text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                        >
                          + Add sequence step
                        </button>
                      </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="mb-3 text-sm font-semibold text-text-100">Canvas Settings</h4>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            Status
                          </p>
                          <p className="mt-1 text-sm font-medium text-text-100">
                            {state.sequenceSteps.length} step{state.sequenceSteps.length > 1 ? "s" : ""} in sequence
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            Audience
                          </p>
                          <p className="mt-1 text-2xl font-bold text-text-100">
                            {state.selectedRecipients.count.toLocaleString()}
                          </p>
                          <p className="text-xs text-text-200">Total recipients selected</p>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            Sending time
                          </p>
                          <input
                            type="time"
                            value={state.dailySendTime}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                dailySendTime: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-text-100"
                          />
                          <p className="mt-2 text-[11px] text-text-200">
                            Campaign resumes at this time when daily limits are reached.
                          </p>
                        </div>

                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-text-200">
                          Template editing is managed through the sequence email editor modal.
                        </p>
                        <Button
                          type="button"
                          className="w-full"
                          onClick={() => setShowSequenceCanvasModal(false)}
                        >
                          Save and close
                        </Button>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          )}
      </>
                ) : (
                  <div className="rounded-xl border border-brand-main/25 bg-bg-100/40 p-3">
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-text-200">Subject</label>
                        <input
                          type="text"
                          value={state.sequenceSteps[0]?.subject || ""}
                          onChange={(e) =>
                            updateSequenceSteps((steps) =>
                              steps.map((s) =>
                                s.id === "step-1" ? { ...s, subject: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Quick question about {{company}}"
                          className="w-full rounded-lg border border-brand-main/20 bg-brand-main/5 px-3 py-1.5 text-sm text-text-100 placeholder-text-200/60 focus:outline-none focus:ring-2 focus:ring-brand-main"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-text-200">Preview text</label>
                        <input
                          type="text"
                          value={state.sequenceSteps[0]?.previewText || ""}
                          onChange={(e) =>
                            updateSequenceSteps((steps) =>
                              steps.map((s) =>
                                s.id === "step-1" ? { ...s, previewText: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Inbox preheader text"
                          className="w-full rounded-lg border border-brand-main/20 bg-brand-main/5 px-3 py-1.5 text-sm text-text-100 placeholder-text-200/60 focus:outline-none focus:ring-2 focus:ring-brand-main"
                        />
                      </div>
                    </div>

                    <div className="mt-2 rounded-lg border border-brand-main/15 bg-bg-100/70 p-3">
                      <p className="mb-1 text-[11px] font-medium text-text-200">Body preview</p>
                      <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-text-100">
                        {state.sequenceSteps[0]?.body?.trim() || "No body yet. Open email editor to create your message."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Campaign Settings */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      validation.campaignName &&
                      validation.domain &&
                      validation.sender
                        ? "bg-success/20"
                        : "bg-brand-main/10"
                    }`}
                  >
                    {validation.campaignName &&
                    validation.domain &&
                    validation.sender ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <Settings size={16} className="text-brand-main" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-text-100">
                      Campaign Settings
                    </h2>
                    <p className="text-xs text-text-200">
                      Final delivery configuration before launch.
                    </p>
                  </div>
                </div>
                {(!validation.campaignName ||
                  !validation.domain ||
                  !validation.sender) && (
                  <div className="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    <span>Required</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Campaign Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-100">
                    Campaign Information
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={state.campaignName}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          campaignName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Q4 Product Launch"
                      className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={state.campaignDescription}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          campaignDescription: e.target.value,
                        }))
                      }
                      placeholder="Campaign description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                </div>

                {/* Sending Configuration */}
                <div className="space-y-3 pt-3 border-t border-brand-main/10">
                  <h3 className="text-sm font-medium text-text-100">
                    Sending Configuration
                  </h3>
                  {/* <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Select Domain *
                    </label>
                    {loadingDomains ? (
                      <div className="text-text-200 text-xs py-2">
                        Loading domains...
                      </div>
                    ) : (
                      <select
                        value={state.domainId}
                        onChange={(e) => {
                          const newDomainId = e.target.value;
                          setState((prev) => ({
                            ...prev,
                            domainId: newDomainId,
                            senderIds: [],
                          }));

                          // Update URL query parameter to maintain domain selection
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          if (newDomainId) {
                            params.set("domainId", newDomainId);
                          } else {
                            params.delete("domainId");
                          }
                          router.replace(
                            `/email/campaigns/builder?${params.toString()}`,
                            { scroll: false }
                          );
                        }}
                        className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 focus:outline-none focus:ring-2 focus:ring-brand-main"
                      >
                        <option value="">Choose a domain...</option>
                        {domains.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.domain}
                          </option>
                        ))}
                      </select>
                    )}
                  </div> */}
                  <div>
                    <label className="block text-xs font-medium text-text-200 mb-1.5">
                      Select Email Senders (Multi-Domain Rotation) *
                    </label>
                    {loadingSenders ? (
                      <div className="text-text-200 text-xs py-2">
                        Loading senders...
                      </div>
                    ) : senders.length === 0 ? (
                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                        <p className="text-xs text-text-200">
                          No verified senders found. Please verify at least one
                          sender from any domain.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Helper text */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                          <p className="text-xs text-text-200">
                            💡 You can select senders from{" "}
                            <strong>multiple domains</strong> for automatic
                            rotation. Leads will be distributed based on each
                            sender&apos;s{" "}
                            {sesProvider === "custom"
                              ? "configured daily send cap (BYO SES)."
                              : "daily capacity."}
                          </p>
                        </div>

                        {/* Multi-select checkboxes - Grouped by domain */}
                        <div className="max-h-64 overflow-y-auto space-y-3 border border-brand-main/20 rounded-lg p-3 bg-brand-main/5">
                          {(() => {
                            // Group senders by domain
                            const sendersByDomain = senders.reduce(
                              (acc, sender) => {
                                const domain = domains.find(
                                  (d) => d.id === sender.domainId
                                );
                                const domainName =
                                  domain?.domain || `Domain ${sender.domainId}`;
                                if (!acc[domainName]) {
                                  acc[domainName] = [];
                                }
                                acc[domainName].push(sender);
                                return acc;
                              },
                              {} as Record<string, EmailSender[]>
                            );

                            return Object.entries(sendersByDomain).map(
                              ([domainName, domainSenders]) => (
                                <div key={domainName} className="space-y-2">
                                  <div className="flex items-center gap-2 pb-1 border-b border-brand-main/10">
                                    <div className="w-2 h-2 rounded-full bg-brand-main"></div>
                                    <p className="text-xs font-semibold text-text-100">
                                      {domainName}
                                    </p>
                                    <span className="text-xs text-text-200/60">
                                      ({domainSenders.length} sender
                                      {domainSenders.length > 1 ? "s" : ""})
                                    </span>
                                  </div>
                                  {domainSenders.map((sender) => {
                                    const isSelected = state.senderIds.includes(
                                      sender.id
                                    );
                                    const quota = sender.quota;
                                    const remaining =
                                      quota?.remaining ?? quota?.dailyCap ?? 0;

                                    return (
                                      <label
                                        key={sender.id}
                                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ml-4 ${
                                          isSelected
                                            ? "bg-brand-main/20 border-2 border-brand-main"
                                            : "bg-transparent border-2 border-transparent hover:bg-brand-main/10"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setState((prev) => ({
                                                ...prev,
                                                senderIds: [
                                                  ...prev.senderIds,
                                                  sender.id,
                                                ],
                                              }));
                                            } else {
                                              setState((prev) => ({
                                                ...prev,
                                                senderIds:
                                                  prev.senderIds.filter(
                                                    (id) => id !== sender.id
                                                  ),
                                              }));
                                            }
                                          }}
                                          className="mt-1 w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-text-100">
                                              {sender.displayName ||
                                                sender.email}
                                            </p>
                                            {quota && (
                                              <span className="text-xs text-text-200 ml-2 whitespace-nowrap">
                                                {remaining.toLocaleString()} /{" "}
                                                {quota.dailyCap.toLocaleString()}{" "}
                                                remaining
                                              </span>
                                            )}
                                          </div>
                                          {sender.displayName && (
                                            <p className="text-xs text-text-200/60 mt-0.5">
                                              {sender.email}
                                            </p>
                                          )}
                                          {quota && (
                                            <div className="mt-1.5">
                                              <div className="w-full bg-brand-main/10 rounded-full h-1.5">
                                                <div
                                                  className={`h-1.5 rounded-full ${
                                                    remaining === 0
                                                      ? "bg-red-500"
                                                      : remaining <
                                                        quota.dailyCap * 0.2
                                                      ? "bg-yellow-500"
                                                      : "bg-green-500"
                                                  }`}
                                                  style={{
                                                    width: `${Math.min(
                                                      ((quota.dailyCap -
                                                        remaining) /
                                                        quota.dailyCap) *
                                                        100,
                                                      100
                                                    )}%`,
                                                  }}
                                                ></div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )
                            );
                          })()}
                        </div>

                        {/* Rotation Preview */}
                        {state.senderIds.length > 0 &&
                          state.selectedRecipients.count > 0 &&
                          rotation && (
                            <div
                              className={`rounded-lg p-3 border ${
                                rotation.canSend
                                  ? "bg-success/10 border-success/30"
                                  : "bg-error/10 border-error/30"
                              }`}
                            >
                              <h4 className="text-xs font-semibold text-text-100 mb-2">
                                Email Rotation Preview
                              </h4>
                              <div className="space-y-2">
                                {rotation.distribution.map((dist) => (
                                  <div
                                    key={dist.sender.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-text-200">
                                      {dist.sender.displayName ||
                                        dist.sender.email}
                                    </span>
                                    <span className="font-medium text-success">
                                      {dist.leads.toLocaleString()} leads
                                    </span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-success/20 mt-2 space-y-1">
                                  <p className="text-xs text-text-200">
                                    Total:{" "}
                                    <span className="font-semibold text-success">
                                      {state.selectedRecipients.count.toLocaleString()}{" "}
                                      leads
                                    </span>{" "}
                                    across{" "}
                                    <span className="font-semibold text-success">
                                      {state.senderIds.length} sender
                                      {state.senderIds.length > 1 ? "s" : ""}
                                    </span>
                                  </p>
                                  {typeof rotation.totalCapacity === "number" &&
                                    rotation.totalCapacity > 0 && (
                                      <p className="text-xs text-text-200">
                                        Combined current daily capacity:{" "}
                                        <span className="font-semibold text-success">
                                          {rotation.totalCapacity.toLocaleString()}{" "}
                                          emails/day
                                        </span>
                                      </p>
                                    )}
                                  {scheduleEstimate &&
                                    scheduleEstimate.estimatedDays > 1 && (
                                    <div className="mt-1 bg-brand-main/5 border border-brand-main/20 rounded-md p-2">
                                      <p className="text-xs font-medium text-text-100 mb-1">
                                        Estimated sending schedule
                                      </p>
                                      <p className="text-xs text-text-200">
                                        With your current{" "}
                                        {sesProvider === "custom"
                                          ? "BYO daily send caps"
                                          : "warmup caps"}
                                        , this campaign is expected to complete in{" "}
                                        <span className="font-semibold">
                                          {scheduleEstimate.estimatedDays} day
                                          {scheduleEstimate.estimatedDays > 1
                                            ? "s"
                                            : ""}
                                        </span>
                                        .
                                      </p>
                                      <ul className="mt-1 text-xs text-text-200 space-y-0.5">
                                        {scheduleEstimate.breakdown.map((d) => (
                                          <li key={d.day}>
                                            Day {d.day}: approx.{" "}
                                            <span className="font-semibold">
                                              {d.count.toLocaleString()}
                                            </span>{" "}
                                            emails
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Selected senders summary */}
                        {state.senderIds.length > 0 && (
                          <div className="bg-brand-main/10 border border-brand-main/20 rounded-lg p-2">
                            <p className="text-xs font-medium text-text-100 mb-1">
                              Selected: {state.senderIds.length} sender
                              {state.senderIds.length > 1 ? "s" : ""} from{" "}
                              {
                                new Set(
                                  state.senderIds
                                    .map((id) => {
                                      const sender = senders.find(
                                        (s) => s.id === id
                                      );
                                      return domains.find(
                                        (d) => d.id === sender?.domainId
                                      )?.domain;
                                    })
                                    .filter(Boolean)
                                ).size
                              }{" "}
                              domain
                              {new Set(
                                state.senderIds
                                  .map((id) => {
                                    const sender = senders.find(
                                      (s) => s.id === id
                                    );
                                    return domains.find(
                                      (d) => d.id === sender?.domainId
                                    )?.domain;
                                  })
                                  .filter(Boolean)
                              ).size > 1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Settings */}
                <div className="pt-3 border-t border-brand-main/10">
                  <h3 className="text-sm font-medium text-text-100 mb-3">
                    Email Settings
                  </h3>
                  <div className="space-y-4">
                    {/* Reply-To Address */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={state.useReplyTo}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              useReplyTo: e.target.checked,
                              replyTo: e.target.checked ? prev.replyTo : "",
                            }))
                          }
                          className="w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                        />
                        <span className="text-xs font-medium text-text-200">
                          Use different Reply-to addresses
                        </span>
                      </label>
                      {state.useReplyTo && (
                        <div className="mt-2 space-y-1">
                          <input
                            type="text"
                            inputMode="email"
                            autoComplete="off"
                            value={state.replyTo || ""}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                replyTo: e.target.value,
                              }))
                            }
                            placeholder="e.g. support@company.com, sales@company.com"
                            className="w-full px-3 py-2 text-sm bg-brand-main/5 border border-brand-main/20 rounded-lg text-text-100 placeholder-text-200/50 focus:outline-none focus:ring-2 focus:ring-brand-main"
                          />
                          <p className="text-[11px] text-text-200/80 leading-snug">
                            Separate multiple addresses with commas.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={state.useAttachment}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              useAttachment: e.target.checked,
                              emailTemplate: {
                                ...prev.emailTemplate,
                                attachments: e.target.checked
                                  ? prev.emailTemplate.attachments
                                  : [],
                              },
                            }))
                          }
                          className="w-4 h-4 rounded border-brand-main/20 text-brand-main focus:ring-brand-main"
                        />
                        <span className="text-xs font-medium text-text-200">
                          Add an attachment
                        </span>
                      </label>
                      {state.useAttachment && (
                        <div className="mt-2">
                          {(state.emailTemplate.attachments || []).length ===
                          0 ? (
                            <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-brand-main/20 rounded-lg cursor-pointer hover:border-brand-main/40 hover:bg-brand-main/5 transition-all">
                              <div className="text-center">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-brand-main/10 flex items-center justify-center">
                                  <span className="text-xl">📎</span>
                                </div>
                                <p className="text-xs font-medium text-text-100 mb-1">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-text-200/60">
                                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 7MB)
                                </p>
                              </div>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  const file = files[0];
                                  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
                                  if (file.size > MAX_FILE_SIZE) {
                                    toast.error(
                                      `File ${file.name} is too large (max 7MB)`
                                    );
                                    return;
                                  }
                                  setState((prev) => ({
                                    ...prev,
                                    emailTemplate: {
                                      ...prev.emailTemplate,
                                      attachments: [
                                        {
                                          name: file.name,
                                          size: file.size,
                                          type: file.type,
                                          file,
                                        },
                                      ],
                                    },
                                  }));
                                  toast.success(`Added ${file.name}`);
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                              />
                            </label>
                          ) : (
                            <div className="space-y-2">
                              {(state.emailTemplate.attachments || []).map(
                                (attachment, index) => {
                                  const sizeInMB = (
                                    attachment.size /
                                    1024 /
                                    1024
                                  ).toFixed(2);
                                  const fileType = attachment.type || "Unknown";
                                  const getFileIcon = (type: string) => {
                                    if (type.includes("pdf")) return "📕";
                                    if (
                                      type.includes("word") ||
                                      type.includes("document")
                                    )
                                      return "📘";
                                    if (
                                      type.includes("sheet") ||
                                      type.includes("excel")
                                    )
                                      return "📗";
                                    if (type.includes("image")) return "🖼️";
                                    return "📄";
                                  };

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-bg-300/50 border border-brand-main/20 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-xl">
                                          {getFileIcon(fileType)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-medium text-text-100 truncate">
                                            {attachment.name}
                                          </p>
                                          <p className="text-xs text-text-200/60 mt-0.5">
                                            {sizeInMB} MB •{" "}
                                            {fileType
                                              .split("/")[1]
                                              ?.toUpperCase() || "FILE"}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setState((prev) => ({
                                            ...prev,
                                            emailTemplate: {
                                              ...prev.emailTemplate,
                                              attachments: (
                                                prev.emailTemplate
                                                  .attachments || []
                                              ).filter((_, i) => i !== index),
                                            },
                                          }));
                                        }}
                                        className="px-2 py-1 text-xs font-medium text-error hover:bg-error/10 rounded transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Send */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-6 text-white shadow-[0_22px_50px_-24px_rgba(37,99,235,0.7)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100/90">
                  Why this builder
                </p>
                <h3 className="mt-2 text-xl font-bold leading-tight">
                  Build clear campaigns that convert without extra complexity.
                </h3>
                <p className="mt-2 text-sm text-blue-100">
                  One streamlined workflow for targeting, writing, sender rotation, and launch.
                </p>
                <div className="mt-4 space-y-2 text-xs text-blue-100/95">
                  <p className="rounded-lg bg-white/10 px-3 py-2">No tab-hopping between tools</p>
                  <p className="rounded-lg bg-white/10 px-3 py-2">Built-in lead and capacity validation</p>
                  <p className="rounded-lg bg-white/10 px-3 py-2">Faster time to first campaign launch</p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)]">
                <h3 className="text-base font-semibold text-text-100 mb-4">
                  Campaign Summary
                </h3>
                <div className="space-y-3">
                  {/* Recipients */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Recipients</p>
                    <div className="flex items-center gap-2">
                      {validation.recipients ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          validation.recipients ? "text-success" : "text-error"
                        }`}
                      >
                        {state.selectedRecipients.count || 0} selected
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">
                      {isSequenceMode ? "Step 1 Subject" : "Subject"}
                    </p>
                    <div className="flex items-center gap-2">
                      {validation.subject ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.subject ? "text-text-100" : "text-error"
                        }`}
                      >
                        {state.sequenceSteps[0]?.subject || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">
                      {isSequenceMode ? "Sequence" : "Content"}
                    </p>
                    <div className="flex items-center gap-2">
                      {validation.content ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium ${
                          validation.content ? "text-success" : "text-error"
                        }`}
                      >
                        {validation.content
                          ? isSequenceMode
                            ? `${state.sequenceSteps.length} steps ready`
                            : "Ready"
                          : "Incomplete"}
                      </p>
                    </div>
                  </div>

                  {/* Domain */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Domain</p>
                    <div className="flex items-center gap-2">
                      {validation.domain ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.domain ? "text-text-100" : "text-error"
                        }`}
                      >
                        {domains.find((d) => d.id === state.domainId)?.domain ||
                          "Not selected"}
                      </p>
                    </div>
                  </div>

                  {/* Senders */}
                  <div>
                    <p className="text-xs text-text-200 mb-1">Senders</p>
                    <div className="flex items-center gap-2">
                      {validation.sender ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertCircle size={14} className="text-error" />
                      )}
                      <p
                        className={`text-xs font-medium truncate ${
                          validation.sender ? "text-text-100" : "text-error"
                        }`}
                      >
                        {state.senderIds.length === 0
                          ? "Not selected"
                          : state.senderIds.length === 1
                          ? senders.find((s) => s.id === state.senderIds[0])
                              ?.email || "1 sender"
                          : `${state.senderIds.length} senders (rotation)`}
                      </p>
                    </div>
                  </div>

                  {/* Capacity Check */}
                  {validation.sender &&
                    state.selectedRecipients.count > 0 &&
                    rotation && (
                      <div>
                        <p className="text-xs text-text-200 mb-1">Capacity</p>
                        <div className="flex items-center gap-2">
                          {validation.capacity ? (
                            <CheckCircle2 size={14} className="text-success" />
                          ) : (
                            <AlertCircle size={14} className="text-error" />
                          )}
                          <p
                            className={`text-xs font-medium ${
                              validation.capacity
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {validation.capacity
                              ? `${state.selectedRecipients.count.toLocaleString()} / ${rotation.totalCapacity.toLocaleString()}`
                              : `Exceeds by ${rotation.excess.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    )}

                  {effectiveCampaignId && (
                    <div className="pt-3 mt-1 border-t border-brand-main/15">
                      <p className="text-xs text-text-200 mb-2">Send activity</p>
                      {sendVolumeLoading && !sendVolume ? (
                        <p className="text-xs text-text-300">Loading…</p>
                      ) : sendVolume ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-text-300 uppercase tracking-wide">
                                Today (UTC)
                              </p>
                              <p className="text-sm font-semibold text-text-100 tabular-nums">
                                {sendVolume.sentToday.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-text-300 uppercase tracking-wide">
                                Yesterday (UTC)
                              </p>
                              <p className="text-sm font-semibold text-text-100 tabular-nums">
                                {sendVolume.sentYesterday.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {sendVolume.sendsByDay.length > 0 && (
                            <div className="max-h-36 overflow-y-auto rounded-md border border-bg-200/80 bg-bg-100/40">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="text-text-300 border-b border-bg-200/60">
                                    <th className="text-left font-medium py-1.5 px-2">
                                      Day (UTC)
                                    </th>
                                    <th className="text-right font-medium py-1.5 px-2">
                                      Sent
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sendVolume.sendsByDay.map((row) => (
                                    <tr
                                      key={row.date}
                                      className="text-text-100 border-b border-bg-200/40 last:border-0"
                                    >
                                      <td className="py-1 px-2 font-mono">{row.date}</td>
                                      <td className="py-1 px-2 text-right tabular-nums font-medium">
                                        {row.count.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <p className="text-[10px] text-text-300 leading-snug">
                            Counts use UTC calendar days so they line up with the table.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-300">
                          No send stats yet (or unavailable).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

       

              {/* Daily send window — only when some sends spill past today's combined sender quota */}
              {showDailySendWindow && (
                <div className="rounded-2xl border border-bg-200 bg-bg-300/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-200" />
                    <p className="text-xs font-medium text-text-100">
                      Daily send window
                    </p>
                  </div>
                  <p className="text-[11px] text-text-300 leading-snug">
                    Part of this campaign sends on a later day because recipient count (
                    {state.selectedRecipients.count.toLocaleString()}) exceeds today&apos;s
                    combined sender capacity (
                    {rotation?.totalCapacity?.toLocaleString() ?? "—"}). Remaining emails
                    resume at this time on the next eligible day (UTC — same as daily send quota).
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={state.dailySendTime}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          dailySendTime: e.target.value,
                        }))
                      }
                      className="flex-1 px-2 py-1.5 text-sm rounded-md border border-bg-200 bg-bg-100 text-text-100"
                    />
                    <div className="flex gap-1">
                      {["09:00", "10:00", "14:00"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setState((prev) => ({ ...prev, dailySendTime: t }))
                          }
                          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                            state.dailySendTime === t
                              ? "border-brand-main bg-brand-main/10 text-brand-main"
                              : "border-bg-200 text-text-300 hover:text-text-100"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-300">
                    Recommended: 09:00–10:00 or 14:00 UTC for typical business open rates.
                  </p>
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending || !isFormValid}
                className="h-12 w-full rounded-xl bg-success text-base font-semibold text-white shadow-lg transition hover:bg-success/90 disabled:bg-success/50"
              >
                {sending ? (
                  isLiveSequenceResume ? "Applying Updates..." : "Launching Campaign..."
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    {isLiveSequenceResume
                      ? "Apply sequence updates"
                      : resumeCampaignId
                        ? "Continue campaign"
                        : "Launch Campaign"}
                  </>
                )}
              </Button>

              {!isFormValid && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3">
                  <p className="text-xs text-error text-center">
                    Please complete all required fields to send
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {previewStep && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-text-100">
                  Email preview - {previewStep.subject || "Untitled step"}
                </p>
                <p className="text-xs text-text-200">
                  Day {previewStep.delayDays} - {previewStep.condition || "always"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStepId(null)}
                className="rounded-lg p-2 text-text-200 transition hover:bg-slate-100 hover:text-text-100"
                aria-label="Close preview modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto bg-slate-50 p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs text-text-200">
                  Subject:{" "}
                  <span className="font-medium text-text-100">
                    {previewStep.subject || "Untitled"}
                  </span>
                </p>
                {previewStep.previewText ? (
                  <p className="mb-3 text-xs text-text-200">{previewStep.previewText}</p>
                ) : null}
                {previewStep.body?.trim() ? (
                  previewStep.bodyEditor === "html" ||
                  /<\/?[a-z][\s\S]*>/i.test(previewStep.body) ? (
                    <div
                      className="overflow-auto rounded-md border border-slate-200 bg-white p-3 text-sm text-text-100"
                      dangerouslySetInnerHTML={{ __html: previewStep.body }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-100">
                      {previewStep.body}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-text-200">No template content yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiscardModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-text-100">Leave campaign builder?</h3>
            <p className="mt-2 text-sm text-text-200">
              If you leave now, unsaved changes in this draft can be lost.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiscardModal(false)}
              >
                Continue editing
              </Button>
              <Button
                type="button"
                className="bg-error text-white hover:bg-error/90"
                onClick={() => {
                  setShowDiscardModal(false);
                  onCancel?.();
                }}
              >
                Discard and leave
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReoonApiKeyRequiredModal
        open={showReoonKeyRequiredModal}
        onOpenChange={setShowReoonKeyRequiredModal}
      />

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <RecipientSelectionModal
          open={showRecipientModal}
          onClose={() => setShowRecipientModal(false)}
          onSelect={handleRecipientsSelected}
          initialSelection={state.selectedRecipients}
          selectedTags={state.selectedTags}
          selectedCategories={state.selectedCategories}
          onTagsChange={(tags) =>
            setState((prev) => ({ ...prev, selectedTags: tags }))
          }
          onCategoriesChange={(categories) =>
            setState((prev) => ({ ...prev, selectedCategories: categories }))
          }
        />
      )}

      <AICampaignGeneratorModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={handleAIGenerated}
      />

      <CreateEmailModal
        open={sequenceEditorOpen}
        onOpenChange={setSequenceEditorOpen}
        domainId={state.domainId}
        excludeCampaignId={resumeCampaignId || effectiveCampaignId || null}
        availableVariables={availableVariables}
        seedSubject={selectedStep?.subject || ""}
        seedPreviewText={selectedStep?.previewText || ""}
        seedUseSpintax={selectedStep?.useSpintax || false}
        seedSpintaxPackId={selectedStep?.spintaxPackId || "general"}
        seedStrictGrammarMode={selectedStep?.strictGrammarMode || false}
        seedHtml={selectedStep?.body || ""}
        seedBodyEditor={selectedStep?.bodyEditor || "simple"}
        openDirectlyToEditor
        onApply={applySelectedStepFromModal}
      />
    </div>
  );
}
