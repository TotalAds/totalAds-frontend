"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { DomainDnsSetupPanel } from "@/components/email/DomainDnsSetupPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dnsRegistrarHost } from "@/lib/dnsRegistrarHost";
import emailClient from "@/utils/api/emailClient";
import {
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconEye,
  IconLoader2,
  IconMail,
  IconShield,
} from "@tabler/icons-react";

// Compact DNS Record — Name (registrar Host/Name) + Value only; MX priority in header
function CompactDNSRecord({
  recordNumber,
  fqdnFull,
  hostShort,
  dnsZone: _dnsZone,
  valueLabel,
  valueValue,
  type,
  priority,
  copiedIndex,
  onCopy,
  nameId,
  valueId,
  priorityId,
}: {
  recordNumber?: number;
  /** Full DNS name (hint for accessibility; Name uses host) */
  fqdnFull: string;
  /** Short host for registrar Host/Name field */
  hostShort: string;
  /** Domain zone (reserved for callers) */
  dnsZone?: string;
  valueLabel: string;
  valueValue: string;
  type: string;
  priority?: string;
  copiedIndex: string | null;
  onCopy: (text: string, id: string) => void;
  nameId: string;
  valueId: string;
  priorityId?: string;
}) {
  const nameCopyId = `${nameId}-name`;
  const priorityCopyId = priorityId || `${nameId}-priority`;
  const nameForDns = hostShort || fqdnFull;

  return (
    <div className="bg-bg-200/60 rounded-lg p-4 border border-text-200/90 hover:border-primary-100/30 transition-all">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-xs text-text-300/80">
        {recordNumber && (
          <span className="font-semibold text-primary-200 uppercase tracking-wider">
            Record {recordNumber}
          </span>
        )}
        {recordNumber && <span className="text-text-300/70">•</span>}
        <span>
          Type:{" "}
          <span className="font-mono font-medium text-sm text-primary-200">
            {type}
          </span>
        </span>
        {priority && (
          <>
            <span className="text-text-300/70">•</span>
            <span className="inline-flex items-center gap-1.5">
              Priority{" "}
              <code className="font-mono text-text-200 text-[0.8125rem]">
                {priority}
              </code>
              <button
                type="button"
                onClick={() => onCopy(priority, priorityCopyId)}
                className="p-1 hover:bg-primary-100/15 rounded transition"
                title="Copy priority"
              >
                {copiedIndex === priorityCopyId ? (
                  <IconCheck className="w-3 h-3 text-green-500" />
                ) : (
                  <IconCopy className="w-3 h-3 text-primary-200" />
                )}
              </button>
            </span>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-text-300/90 uppercase tracking-wide block mb-1.5">
            Name
          </label>
          <div
            className="flex items-center gap-2 bg-bg-100/50 rounded-md p-2.5 border border-bg-300/30"
            title={`Full DNS name: ${fqdnFull}`}
          >
            <code className="text-text-100 font-mono text-xs break-all flex-1">
              {nameForDns}
            </code>
            <button
              type="button"
              onClick={() => onCopy(nameForDns, nameCopyId)}
              className="p-1.5 hover:bg-primary-100/15 rounded transition flex-shrink-0"
              title="Copy name"
            >
              {copiedIndex === nameCopyId ? (
                <IconCheck className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-primary-200" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-text-300/85 leading-snug">
            Copy Name into Host
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-text-300/90 uppercase tracking-wide block mb-1.5">
            {valueLabel}
          </label>
          <div className="flex items-center gap-2 bg-bg-100/50 rounded-md p-2.5 border border-bg-300/30">
            <code className="text-text-100 font-mono text-xs break-all flex-1">
              {valueValue}
            </code>
            <button
              type="button"
              onClick={() => onCopy(valueValue, valueId)}
              className="p-1.5 hover:bg-primary-100/15 rounded transition flex-shrink-0"
              title="Copy"
            >
              {copiedIndex === valueId ? (
                <IconCheck className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-primary-200" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyDomainPage() {
  const params = useParams();
  const domainId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [dnsLoading, setDnsLoading] = useState(true);
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [spfTab, setSpfTab] = useState<"merge" | "new">("merge"); // Tab for SPF record options
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "pending" | "verified" | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchDomainInfo();
    fetchDnsRecords();
  }, [domainId]);

  // Check if we should show verification screen on mount (if domain is verified)
  useEffect(() => {
    if (domainInfo) {
      const isVerified = 
        domainInfo.verificationStatus === "verified" && 
        domainInfo.dkimStatus === "verified";
      // Auto-show verification screen if verified
      if (isVerified && !showVerificationScreen && !verificationResult) {
        setVerificationResult({
          status: "verified",
          message: "Domain is verified and ready to use",
        });
        setShowVerificationScreen(true);
      }
    }
  }, [domainInfo]);

  const fetchDomainInfo = async () => {
    try {
      const token = Cookies.get("userAccessToken");
      const response = await emailClient.get(`/api/domains/${domainId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDomainInfo(response.data.data);
    } catch (error: any) {
      console.error("Error fetching domain info:", error);
    }
  };

  const fetchDnsRecords = async () => {
    setDnsLoading(true);
    try {
      const token = Cookies.get("userAccessToken");
      const response = await emailClient.get(
        `/api/domains/${domainId}/dns-records`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(response);
      setDns(response.data.data);
    } catch (error: any) {
      console.error("Error fetching DNS records:", error);
    } finally {
      setDnsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("userAccessToken");
      const response = await emailClient.post(
        `/api/domains/${domainId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get updated domain info
      await fetchDomainInfo();
      
      // Determine verification status from response
      const verificationStatus = response.data.data?.verificationStatus || domainInfo?.verificationStatus;
      const dkimStatus = response.data.data?.dkimStatus || domainInfo?.dkimStatus;
      const isVerified = verificationStatus === "verified" && dkimStatus === "verified";
      
      // Set verification result
      setVerificationResult({
        status: isVerified ? "verified" : "pending",
        message: response.data.data?.message || response.data.message || "Verification check completed",
      });
      
      // Show verification screen
      setShowVerificationScreen(true);
      
      if (isVerified) {
        toast.success("Domain verified successfully!");
      } else {
        toast.success("Verification check completed. Domain is pending verification.");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to verify domain";
      toast.error(errorMessage);
      setVerificationResult({
        status: "pending",
        message: errorMessage,
      });
      setShowVerificationScreen(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Check completion status - Now only 2 steps
  const isStep1Complete =
    domainInfo?.verificationStatus === "verified" ||
    domainInfo?.dkimStatus === "verified" ||
    domainInfo?.dkimStatus === "Success";
  const isStep2Complete =
    domainInfo?.dkimStatus === "verified" ||
    domainInfo?.dkimStatus === "Success";
  const isFullyVerified = isStep1Complete && isStep2Complete;
  const isPending =
    domainInfo?.verificationStatus === "pending" ||
    domainInfo?.dkimStatus === "pending";

  const spfOk = Boolean(dns?.liveDnsChecks?.spfSatisfied);
  /** Public DNS already has correct DKIM CNAMEs (may still need Amazon SES to confirm) */
  const dnsDkimOk = Boolean(dns?.liveDnsChecks?.dkimSatisfied);
  /** Only hide DKIM CNAME rows after SES marks DKIM verified */
  const sesDkimVerified = domainInfo?.dkimStatus === "verified";

  /** How to present the setup UI based on live DNS checks */
  const setupLayout = useMemo(() => {
    if (isFullyVerified) return "verified" as const;
    if (!dns?.liveDnsChecks) return "loading" as const;
    if (spfOk && dnsDkimOk && sesDkimVerified) return "compact" as const;
    if (spfOk && dnsDkimOk && !sesDkimVerified)
      return "ses-dkim-pending" as const;
    if (!spfOk && !dnsDkimOk) return "dual" as const;
    if (!spfOk && dnsDkimOk) return "spf-only" as const;
    return "dkim-only" as const;
  }, [
    dns?.liveDnsChecks,
    isFullyVerified,
    spfOk,
    dnsDkimOk,
    sesDkimVerified,
  ]);

  const dnsZone = domainInfo?.domain || "";

  /** Host to paste at GoDaddy / Namecheap + full FQDN note (registrars append your domain) */
  const dnsReg = useMemo(() => {
    const z = domainInfo?.domain || "";
    if (!z) return { mx: null, spf: null, dmarc: null };
    const spf = dnsRegistrarHost(z, z);
    const dmarc = dnsRegistrarHost(`_dmarc.${z}`, z);
    const mx = dns?.dnsRecords?.mailFrom
      ? dnsRegistrarHost(dns.dnsRecords.mailFrom.domain, z)
      : null;
    return { mx, spf, dmarc };
  }, [domainInfo?.domain, dns?.dnsRecords?.mailFrom]);

  // Get all DNS records for the modal (registrar-relative host + FQDN hint)
  const getAllDnsRecords = () => {
    const records: {
      number: number;
      type: string;
      nameHost: string;
      fqdn: string;
      value: string;
      priority?: string;
    }[] = [];
    let recordNum = 1;

    // MX Record
    if (dns?.dnsRecords?.mailFrom && dnsZone) {
      const mx = dnsRegistrarHost(dns.dnsRecords.mailFrom.domain, dnsZone);
      records.push({
        number: recordNum++,
        type: "MX",
        nameHost: mx.host,
        fqdn: mx.fqdn,
        value: dns.dnsRecords.mailFrom.mx.value,
        priority: dns.dnsRecords.mailFrom.mx.priority,
      });
    }

    // Root Domain SPF (omit when live DNS already authorizes SES)
    if (dns?.dnsRecords?.spf && !spfOk && dnsZone) {
      const spfValue =
        spfTab === "merge" && dns.dnsRecords.spf.recommendedMerge
          ? dns.dnsRecords.spf.recommendedMerge
          : dns.dnsRecords.spf.recommendedNew;
      const spf = dnsRegistrarHost(dnsZone, dnsZone);
      records.push({
        number: recordNum++,
        type: "TXT",
        nameHost: spf.host,
        fqdn: spf.fqdn,
        value: spfValue,
      });
    }

    // DMARC
    if (dns?.dnsRecords?.dmarc && dnsZone) {
      const dmarcValue =
        dns.dnsRecords.dmarc.recommendedMerge ||
        dns.dnsRecords.dmarc.recommendedNew;
      const dm = dnsRegistrarHost(`_dmarc.${dnsZone}`, dnsZone);
      records.push({
        number: recordNum++,
        type: "TXT",
        nameHost: dm.host,
        fqdn: dm.fqdn,
        value: dmarcValue,
      });
    }

    // DKIM Records (omit when CNAMEs already correct or SES verified)
    const dkimTokens =
      dns?.dnsRecords?.dkim || domainInfo?.dkimTokens?.tokens || [];
    if (!sesDkimVerified && dnsZone) {
      dkimTokens.forEach((token: any) => {
        const tokenStr =
          typeof token === "string"
            ? token
            : token?.name?.split("._domainkey.")[0];
        const dkimFq = `${tokenStr}._domainkey.${dnsZone}`;
        const dk = dnsRegistrarHost(dkimFq, dnsZone);
        records.push({
          number: recordNum++,
          type: "CNAME",
          nameHost: dk.host,
          fqdn: dk.fqdn,
          value: `${tokenStr}.dkim.amazonses.com`,
        });
      });
    }

    return records;
  };

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="bg-bg-200/30 border-b border-bg-300/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/email/domains"
            className="text-text-300/90 hover:text-primary-200 font-medium text-sm inline-flex items-center gap-2 transition-colors"
          >
            ← Back to Domains
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Screen - Show after clicking verify or if verified */}
        {showVerificationScreen || isFullyVerified ? (
          <div className="mb-8">
            {/* Success State */}
            {isFullyVerified || verificationResult?.status === "verified" ? (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8 mb-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-6">
                    <IconCircleCheck className="w-12 h-12 text-green-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-text-100 mb-3">
                    🎉 Domain Verified Successfully!
                  </h1>
                  <p className="text-text-200/90 text-base mb-2 max-w-lg mx-auto">
                    {verificationResult?.message || "Your domain is fully configured and ready to send emails."}
                  </p>
                  <p className="text-text-300/80 text-sm mb-6">
                    All DNS records have been verified and your domain is ready to use.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={() => setShowDnsModal(true)}
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <IconEye className="w-4 h-4 mr-2" />
                      View DNS Records
                    </Button>
                    <Button
                      onClick={() => {
                        window.location.href = "/email/domains";
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Go to Domains
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Pending State */
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-8 mb-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/30 mb-6">
                    <IconLoader2 className="w-12 h-12 text-blue-400 animate-spin" />
                  </div>
                  <h1 className="text-3xl font-bold text-text-100 mb-3">
                    Verification Pending
                  </h1>
                  <p className="text-text-200/90 text-base mb-4 max-w-lg mx-auto">
                    {verificationResult?.message || "We're checking your DNS records. This may take a few minutes while DNS propagates."}
                  </p>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                    <p className="text-text-200/90 text-sm mb-2">
                      <strong className="text-text-100">What's happening?</strong>
                    </p>
                    <p className="text-text-300/90 text-sm">
                      DNS propagation typically takes 5-30 minutes, but can take up to 72 hours in some cases. 
                      Make sure all DNS records are correctly added to your domain provider.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={() => setShowDnsModal(true)}
                      variant="outline"
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <IconEye className="w-4 h-4 mr-2" />
                      View DNS Records
                    </Button>
                    <Button
                      onClick={handleVerifyDomain}
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {loading ? (
                        <>
                          <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Again"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowVerificationScreen(false);
                        setVerificationResult(null);
                      }}
                      variant="outline"
                      className="border-bg-300/50 text-text-300 hover:bg-bg-200/50"
                    >
                      Back to Setup
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Show DNS Records Section when verified */}
            {isFullyVerified && (
              <div className="bg-bg-200/30 border border-bg-300/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text-100 mb-4">
                  DNS Records Reference
                </h3>
                <p className="text-text-300/80 text-sm mb-4">
                  Your DNS records are configured correctly. Below are the records for your reference.
                </p>
                <Button
                  onClick={() => setShowDnsModal(true)}
                  variant="outline"
                  className="border-bg-300/50 text-text-200 hover:bg-bg-200/50"
                >
                  <IconEye className="w-4 h-4 mr-2" />
                  View All DNS Records
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Setup Screen - Only show when not verified and not showing verification screen */
          <>
            {/* DNS Records Section - Always show (wizard for unverified, read-only for verified) */}
            <>
            {/* Page Header - Only show for unverified domains */}
            {!isFullyVerified && (
              <div className="relative min-h-[260px]">
            {dnsLoading && (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-bg-100/85 backdrop-blur-sm border border-bg-300/40"
                aria-busy="true"
                aria-live="polite"
              >
                <IconLoader2 className="w-10 h-10 text-primary-200 animate-spin" />
                <p className="mt-4 text-sm font-medium text-text-100">
                  Loading DNS records…
                </p>
                <p className="mt-1 text-xs text-text-300/90 max-w-sm text-center px-4">
                  Checking your domain and public DNS. This may take a few seconds.
                </p>
              </div>
            )}
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-text-100 mb-1">
                    Setup Your Domain
                  </h1>
                  <p className="text-text-300 text-sm">
                    {dnsLoading &&
                      "Loading DNS recommendations and live checks…"}
                    {!dnsLoading && setupLayout === "loading" &&
                      "Checking your public DNS for existing records…"}
                    {setupLayout === "dual" &&
                      "Strict setup: add or fix every record in one place — including DKIM CNAMEs at the bottom."}
                    {setupLayout === "compact" &&
                      "SPF and DKIM are confirmed in DNS and by Amazon SES. Finish any remaining records below."}
                    {setupLayout === "ses-dkim-pending" &&
                      "Public DNS already has SPF and DKIM CNAMEs. Click Verify so Amazon SES can confirm DKIM."}
                    {setupLayout === "spf-only" &&
                      "Your DKIM CNAMEs already match what we need in DNS. Fix SPF (and review DMARC) below."}
                    {setupLayout === "dkim-only" &&
                      "Your SPF already authorizes our mail. Add or fix DKIM CNAMEs below."}
                  </p>
                </div>

                {setupLayout === "dual" && (
                  <div className="mb-6 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
                    <strong className="font-semibold text-amber-600">
                      Action needed:
                    </strong>{" "}
                    Both SPF and public DKIM CNAMEs need attention. Use the full
                    list below (scroll to DKIM CNAMEs) — do not skip them.
                  </div>
                )}

                <DomainDnsSetupPanel />
              </>
              </div>
            )}

            {/* Header for verified domains */}
            {isFullyVerified && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-100 mb-1">
                  DNS Records
                </h1>
                <p className="text-text-300 text-sm">
                  Your domain DNS configuration
                </p>
              </div>
            )}

            {/* Step Content Card - Show Only Current Step for unverified, show all for verified */}
            <div
              className={`relative bg-gradient-to-br from-primary-100/8 to-primary-300/8 rounded-2xl overflow-hidden mb-6 ${
                setupLayout === "dual"
                  ? "border-2 border-amber-500/45 ring-2 ring-amber-500/25 shadow-lg shadow-amber-950/20"
                  : setupLayout === "spf-only" || setupLayout === "dkim-only"
                    ? "border-2 border-amber-500/40 ring-1 ring-amber-500/20"
                    : setupLayout === "compact" ||
                        setupLayout === "ses-dkim-pending"
                      ? "border border-emerald-500/35 ring-1 ring-emerald-500/15"
                      : "border border-primary-100/15"
              }`}
            >
              {dnsLoading && !isFullyVerified && (
                <div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg-100/80 backdrop-blur-[2px]"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <IconLoader2 className="w-9 h-9 text-primary-200 animate-spin" />
                  <p className="mt-3 text-sm font-medium text-text-100">
                    Loading DNS records…
                  </p>
                </div>
              )}
              {/* Header — strict “dual” path (all record types on one scroll) */}
              {!isFullyVerified && setupLayout === "dual" && (
                <div className="bg-gradient-to-r from-amber-500/90 to-amber-600/90 p-6 text-text-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/30 text-white flex items-center justify-center flex-shrink-0">
                      <IconShield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold opacity-95 mb-1">
                        Strict setup (one screen)
                      </div>
                      <h2 className="text-xl font-bold">
                        MX, SPF, DMARC & DKIM CNAMEs
                      </h2>
                      <p className="text-sm opacity-95 mt-1">
                        Scroll through every block. DKIM CNAMEs are required for
                        Amazon SES — they appear in the DKIM section at the bottom.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Single-screen headers (non–strict wizard) */}
              {!isFullyVerified &&
                (setupLayout === "compact" ||
                  setupLayout === "spf-only" ||
                  setupLayout === "dkim-only" ||
                  setupLayout === "ses-dkim-pending") && (
                  <div className="bg-gradient-to-r from-primary-100/90 to-primary-200/90 p-6 text-text-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black/30 text-white flex items-center justify-center flex-shrink-0">
                        {setupLayout === "compact" ||
                        setupLayout === "ses-dkim-pending" ? (
                          <IconCircleCheck className="w-6 h-6" />
                        ) : setupLayout === "spf-only" ? (
                          <IconShield className="w-6 h-6" />
                        ) : (
                          <IconMail className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold opacity-95 mb-1">
                          {setupLayout === "compact"
                            ? "Almost there"
                            : setupLayout === "ses-dkim-pending"
                              ? "DNS looks good"
                              : setupLayout === "spf-only"
                                ? "Fix SPF"
                                : "Fix DKIM"}
                        </div>
                        <h2 className="text-xl font-bold">
                          {setupLayout === "compact" &&
                            "MX & DMARC — finish routing & reporting"}
                          {setupLayout === "ses-dkim-pending" &&
                            "Confirm with Amazon SES"}
                          {setupLayout === "spf-only" &&
                            "SPF, DMARC & mail routing"}
                          {setupLayout === "dkim-only" &&
                            "DKIM CNAMEs, DMARC & mail routing"}
                        </h2>
                        <p className="text-sm opacity-95 mt-1">
                          {setupLayout === "compact" &&
                            "We hid the SPF row because DNS already authorizes our mail. DKIM CNAMEs stay listed below until Amazon SES marks DKIM verified."}
                          {setupLayout === "ses-dkim-pending" &&
                            "Your public DNS already has the right SPF and DKIM CNAMEs; the DKIM section below is for your records and copy/paste. Click Verify & Complete so Amazon SES can mark DKIM verified."}
                          {setupLayout === "spf-only" &&
                            "DKIM is already correct in DNS; focus on SPF and the records below."}
                          {setupLayout === "dkim-only" &&
                            "SPF already includes our mail servers; add the DKIM CNAMEs below."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Step Content */}
              <div className="p-6 bg-bg-100/30">
                {/* --- Shared: MX + SPF + DMARC (varies by layout) --- */}
                {!isFullyVerified &&
                  (setupLayout === "loading" ||
                    setupLayout === "spf-only" ||
                    setupLayout === "compact" ||
                    setupLayout === "dkim-only" ||
                    setupLayout === "ses-dkim-pending" ||
                    setupLayout === "dual") && (
                  <div className="space-y-4">
                    {dns?.dnsRecords?.mailFrom && dnsReg.mx && (
                      <CompactDNSRecord
                        recordNumber={1}
                        fqdnFull={dnsReg.mx.fqdn}
                        hostShort={dnsReg.mx.host}
                        dnsZone={dnsZone}
                        valueLabel="Value"
                        valueValue={dns.dnsRecords.mailFrom.mx.value}
                        type="MX"
                        priority={dns.dnsRecords.mailFrom.mx.priority}
                        copiedIndex={copiedIndex}
                        onCopy={copyToClipboard}
                        nameId="mx-name"
                        valueId="mx-value"
                        priorityId="mx-priority"
                      />
                    )}

                    {/* SPF — hidden when live DNS already authorizes SES */}
                    {!spfOk &&
                      dns?.dnsRecords?.spf &&
                      dnsReg.spf && (
                      <div className="space-y-3">
                        {/* Show tabs only if existing SPF detected */}
                        {dns.dnsRecords.spf.existing &&
                        dns.dnsRecords.spf.existing.length > 0 ? (
                          <>
                            {/* Tab Navigation */}
                            <div className="flex gap-2 p-1 bg-bg-200/40 rounded-lg border border-bg-300/50">
                              <button
                                onClick={() => setSpfTab("merge")}
                                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                                  spfTab === "merge"
                                    ? "bg-primary-200 text-white"
                                    : "text-text-300/90 hover:text-text-200"
                                }`}
                              >
                                Merge with Existing SPF (Recommended)
                              </button>
                              <button
                                onClick={() => setSpfTab("new")}
                                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                                  spfTab === "new"
                                    ? "bg-primary-200 text-white"
                                    : "text-text-300/90 hover:text-text-200"
                                }`}
                              >
                                Add New SPF Record
                              </button>
                            </div>

                            {/* Tab Content */}
                            {spfTab === "merge" ? (
                              <>
                                <div className="text-xs text-amber-500 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                                  ⚠️ <strong>Existing SPF detected.</strong>{" "}
                                  Replace your current SPF record with the
                                  merged value below.
                                </div>
                                <CompactDNSRecord
                                  recordNumber={2}
                                  fqdnFull={dnsReg.spf.fqdn}
                                  hostShort={dnsReg.spf.host}
                                  dnsZone={dnsZone}
                                  valueLabel="Merged SPF Value"
                                  valueValue={
                                    dns.dnsRecords.spf.recommendedMerge
                                  }
                                  type="TXT"
                                  copiedIndex={copiedIndex}
                                  onCopy={copyToClipboard}
                                  nameId="spf-name"
                                  valueId="spf-merge"
                                />
                              </>
                            ) : (
                              <CompactDNSRecord
                                recordNumber={2}
                                fqdnFull={dnsReg.spf.fqdn}
                                hostShort={dnsReg.spf.host}
                                dnsZone={dnsZone}
                                valueLabel="Value"
                                valueValue={dns.dnsRecords.spf.recommendedNew}
                                type="TXT"
                                copiedIndex={copiedIndex}
                                onCopy={copyToClipboard}
                                nameId="spf-name"
                                valueId="spf-new"
                              />
                            )}
                          </>
                        ) : (
                          <CompactDNSRecord
                            recordNumber={2}
                            fqdnFull={dnsReg.spf.fqdn}
                            hostShort={dnsReg.spf.host}
                            dnsZone={dnsZone}
                            valueLabel="Value"
                            valueValue={dns.dnsRecords.spf.recommendedNew}
                            type="TXT"
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="spf-name"
                            valueId="spf-value"
                          />
                        )}
                      </div>
                    )}

                    {/* DMARC Record */}
                    {dns?.dnsRecords?.dmarc && dnsReg.dmarc && (
                      <>
                        {dns.dnsRecords.dmarc.existing ? (
                          <div className="space-y-3">
                            <div className="text-xs text-amber-500 bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                              ⚠️ <strong>Existing DMARC detected.</strong>{" "}
                              Replace your current DMARC record with the merged
                              value below.
                            </div>
                            <CompactDNSRecord
                              recordNumber={3}
                              fqdnFull={dnsReg.dmarc.fqdn}
                              hostShort={dnsReg.dmarc.host}
                              dnsZone={dnsZone}
                              valueLabel="Merged DMARC Value"
                              valueValue={dns.dnsRecords.dmarc.recommendedMerge}
                              type="TXT"
                              copiedIndex={copiedIndex}
                              onCopy={copyToClipboard}
                              nameId="dmarc-name"
                              valueId="dmarc-merge"
                            />
                          </div>
                        ) : (
                          <CompactDNSRecord
                            recordNumber={3}
                            fqdnFull={dnsReg.dmarc.fqdn}
                            hostShort={dnsReg.dmarc.host}
                            dnsZone={dnsZone}
                            valueLabel="Value"
                            valueValue={dns.dnsRecords.dmarc.recommendedNew}
                            type="TXT"
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="dmarc-name"
                            valueId="dmarc-value"
                          />
                        )}
                      </>
                    )}

                    {/* DKIM CNAMEs — show until SES confirms DKIM; never hide just because SPF/DKIM look OK in DNS */}
                    {!sesDkimVerified &&
                      ((dns?.dnsRecords?.dkim?.length || 0) > 0 ||
                        (domainInfo?.dkimTokens?.tokens?.length || 0) > 0) && (
                        <div className="space-y-3 pt-2 border-t border-bg-300/40">
                          <p className="text-xs font-semibold text-text-200 uppercase tracking-wide">
                            DKIM (CNAME)
                          </p>
                          {(
                            dns?.dnsRecords?.dkim ||
                            domainInfo?.dkimTokens?.tokens ||
                            []
                          ).map((token: any, index: number) => {
                            const tokenStr =
                              typeof token === "string"
                                ? token
                                : token?.name?.split("._domainkey.")[0];
                            const dk = dnsZone
                              ? dnsRegistrarHost(
                                  `${tokenStr}._domainkey.${dnsZone}`,
                                  dnsZone
                                )
                              : null;
                            if (!dk) return null;
                            return (
                              <CompactDNSRecord
                                key={index}
                                recordNumber={index + 1}
                                fqdnFull={dk.fqdn}
                                hostShort={dk.host}
                                dnsZone={dnsZone}
                                valueLabel="Value"
                                valueValue={`${tokenStr}.dkim.amazonses.com`}
                                type="CNAME"
                                copiedIndex={copiedIndex}
                                onCopy={copyToClipboard}
                                nameId={`dkim-name-${index}`}
                                valueId={`dkim-value-${index}`}
                              />
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}

                {/* For verified: Show ALL DNS records in organized sections */}
                {isFullyVerified && (
                  <div className="space-y-6">
                    {/* Section 1: Email Security Records */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-100 mb-4 flex items-center gap-2">
                        <IconShield className="w-5 h-5 text-primary-100" />
                        Email Security Records
                      </h3>
                      <div className="space-y-4">
                        {/* MX Record */}
                        {dns?.dnsRecords?.mailFrom && dnsReg.mx && (
                          <CompactDNSRecord
                            recordNumber={1}
                            fqdnFull={dnsReg.mx.fqdn}
                            hostShort={dnsReg.mx.host}
                            dnsZone={dnsZone}
                            valueLabel="Value"
                            valueValue={dns.dnsRecords.mailFrom.mx.value}
                            type="MX"
                            priority={dns.dnsRecords.mailFrom.mx.priority}
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="mx-name-verified"
                            valueId="mx-value-verified"
                            priorityId="mx-priority-verified"
                          />
                        )}

                        {/* Root SPF (only this one, not mailFrom SPF) */}
                        {dns?.dnsRecords?.spf && dnsReg.spf && (
                          <CompactDNSRecord
                            recordNumber={2}
                            fqdnFull={dnsReg.spf.fqdn}
                            hostShort={dnsReg.spf.host}
                            dnsZone={dnsZone}
                            valueLabel="Value"
                            valueValue={
                              dns.dnsRecords.spf.recommendedMerge ||
                              dns.dnsRecords.spf.recommendedNew
                            }
                            type="TXT"
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="spf-name-verified"
                            valueId="spf-value-verified"
                          />
                        )}

                        {/* DMARC */}
                        {dns?.dnsRecords?.dmarc && dnsReg.dmarc && (
                          <CompactDNSRecord
                            recordNumber={3}
                            fqdnFull={dnsReg.dmarc.fqdn}
                            hostShort={dnsReg.dmarc.host}
                            dnsZone={dnsZone}
                            valueLabel="Value"
                            valueValue={
                              dns.dnsRecords.dmarc.recommendedMerge ||
                              dns.dnsRecords.dmarc.recommendedNew
                            }
                            type="TXT"
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="dmarc-name-verified"
                            valueId="dmarc-value-verified"
                          />
                        )}
                      </div>
                    </div>

                    {/* Section 2: DKIM Records */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-100 mb-4 flex items-center gap-2">
                        <IconMail className="w-5 h-5 text-primary-100" />
                        DKIM Authentication Records
                      </h3>
                      <div className="space-y-4">
                        {((dns?.dnsRecords?.dkim?.length || 0) > 0 ||
                          (domainInfo?.dkimTokens?.tokens?.length || 0) >
                            0) && (
                          <>
                            {(
                              dns?.dnsRecords?.dkim ||
                              domainInfo?.dkimTokens?.tokens ||
                              []
                            ).map((token: any, index: number) => {
                              const tokenStr =
                                typeof token === "string"
                                  ? token
                                  : token?.name?.split("._domainkey.")[0];
                              const dk = dnsZone
                                ? dnsRegistrarHost(
                                    `${tokenStr}._domainkey.${dnsZone}`,
                                    dnsZone
                                  )
                                : null;
                              if (!dk) return null;
                              return (
                                <CompactDNSRecord
                                  key={index}
                                  recordNumber={index + 1}
                                  fqdnFull={dk.fqdn}
                                  hostShort={dk.host}
                                  dnsZone={dnsZone}
                                  valueLabel="Value"
                                  valueValue={`${tokenStr}.dkim.amazonses.com`}
                                  type="CNAME"
                                  copiedIndex={copiedIndex}
                                  onCopy={copyToClipboard}
                                  nameId={`dkim-name-verified-${index}`}
                                  valueId={`dkim-value-verified-${index}`}
                                />
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation — all setup paths use a single Verify (dual wizard merged into one list) */}
            {!isFullyVerified &&
              (setupLayout === "compact" ||
                setupLayout === "spf-only" ||
                setupLayout === "dkim-only" ||
                setupLayout === "ses-dkim-pending" ||
                setupLayout === "dual" ||
                setupLayout === "loading") && (
                <div className="flex justify-end mb-6">
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={loading || dnsLoading}
                    className="bg-green-500 hover:bg-green-600 text-white min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <IconCircleCheck className="w-4 h-4 mr-2" />
                        Verify & Complete
                      </>
                    )}
                  </Button>
                </div>
              )}

            {/* Info Section - Only show for unverified */}
            {!isFullyVerified && (
              <div className="bg-bg-200/20 border border-bg-300/50 rounded-xl p-6">
                <h3 className="text-text-100 font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-200"></div>
                  Quick Setup Guide
                </h3>
                <ul className="space-y-3 text-sm text-text-200/90">
                  <li className="flex gap-3">
                    <span className="text-primary-200 font-bold">1.</span>
                    <span>
                      Copy each DNS value above (use the copy buttons).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-200 font-bold">2.</span>
                    <span>
                      Open your domain host (GoDaddy, Namecheap, Cloudflare,
                      etc.) and paste into DNS / DNS management.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-200 font-bold">3.</span>
                    <span>
                      Wait 5–30 minutes for DNS to update (rarely up to 48
                      hours).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-200 font-bold">4.</span>
                    <span>
                      Click &quot;Verify &amp; Complete&quot; to let Amazon check
                      your records.
                    </span>
                  </li>
                </ul>
              </div>
            )}
            </>
          </>
        )}
      </main>

      {/* View DNS Modal */}
      <Dialog open={showDnsModal} onOpenChange={setShowDnsModal}>
        <DialogContent className="bg-bg-200 border border-bg-300/50 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-100 text-xl flex items-center gap-2">
              <IconEye className="w-5 h-5 text-primary-200" />
              DNS Records
            </DialogTitle>
            <DialogDescription className="text-text-200/80 text-sm">
              Copy Name into Host
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {getAllDnsRecords().map((record) => (
              <CompactDNSRecord
                key={`${record.type}-${record.nameHost}-${record.number}`}
                recordNumber={record.number}
                fqdnFull={record.fqdn}
                hostShort={record.nameHost}
                dnsZone={dnsZone}
                valueLabel="Value"
                valueValue={record.value}
                type={record.type}
                priority={record.priority}
                copiedIndex={copiedIndex}
                onCopy={copyToClipboard}
                nameId={`modal-${record.type}-${record.number}-name`}
                valueId={`modal-${record.type}-${record.number}-value`}
                priorityId={
                  record.priority
                    ? `modal-${record.type}-${record.number}-priority`
                    : undefined
                }
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
