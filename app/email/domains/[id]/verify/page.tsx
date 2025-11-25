"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";
import {
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconMail,
  IconShield,
} from "@tabler/icons-react";

// Compact DNS Record for Multiple Records
function CompactDNSRecord({
  recordNumber,
  nameLabel,
  nameValue,
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
  nameLabel: string;
  nameValue: string;
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
  return (
    <div className="bg-bg-200/50 rounded-lg p-4 border border-bg-300 hover:border-primary-100/20 transition-all">
      {/* Record Number and Type at Top */}
      <div className="flex items-center gap-2 mb-3">
        {recordNumber && (
          <div className="text-xs font-bold text-primary-100 uppercase tracking-wider">
            Record {recordNumber}
          </div>
        )}
        <div className="text-xs text-text-300">•</div>
        <div className="text-xs text-text-300">
          Type:{" "}
          <span className="font-mono font-semibold text-primary-100">
            {type}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-300 uppercase tracking-wide block mb-1.5">
            {nameLabel}
          </label>
          <div className="flex items-center gap-2 bg-bg-100 rounded-md p-2.5 border border-bg-300">
            <code className="text-text-100 font-mono text-xs break-all flex-1">
              {nameValue}
            </code>
            <button
              onClick={() => onCopy(nameValue, nameId)}
              className="p-1.5 hover:bg-primary-100/20 rounded transition flex-shrink-0"
              title="Copy"
            >
              {copiedIndex === nameId ? (
                <IconCheck className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-primary-100" />
              )}
            </button>
          </div>
        </div>
        {priority && (
          <div>
            <label className="text-xs font-semibold text-text-300 uppercase tracking-wide block mb-1.5">
              Priority
            </label>
            <div className="flex items-center gap-2 bg-bg-100 rounded-md p-2.5 border border-bg-300">
              <code className="text-text-100 font-mono text-xs break-all flex-1">
                {priority}
              </code>
              <button
                onClick={() =>
                  onCopy(priority, priorityId || `${nameId}-priority`)
                }
                className="p-1.5 hover:bg-primary-100/20 rounded transition flex-shrink-0"
                title="Copy"
              >
                {copiedIndex === (priorityId || `${nameId}-priority`) ? (
                  <IconCheck className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <IconCopy className="w-3.5 h-3.5 text-primary-100" />
                )}
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-text-300 uppercase tracking-wide block mb-1.5">
            {valueLabel}
          </label>
          <div className="flex items-center gap-2 bg-bg-100 rounded-md p-2.5 border border-bg-300">
            <code className="text-text-100 font-mono text-xs break-all flex-1">
              {valueValue}
            </code>
            <button
              onClick={() => onCopy(valueValue, valueId)}
              className="p-1.5 hover:bg-primary-100/20 rounded transition flex-shrink-0"
              title="Copy"
            >
              {copiedIndex === valueId ? (
                <IconCheck className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-primary-100" />
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
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [spfTab, setSpfTab] = useState<"merge" | "new">("merge"); // Tab for SPF record options

  useEffect(() => {
    fetchDomainInfo();
    fetchDnsRecords();
  }, [domainId]);

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
    }
  };

  const handleVerifyDomain = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("userAccessToken");
      await emailClient.post(
        `/api/domains/${domainId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Verification check initiated!");
      await fetchDomainInfo();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to verify domain";
      toast.error(errorMessage);
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

  return (
    <div className="min-h-screen bg-bg-100">
      {/* Header */}
      <header className="bg-bg-200/50 border-b border-bg-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/email/domains"
            className="text-text-300 hover:text-primary-100 font-medium text-sm inline-flex items-center gap-2 transition-colors"
          >
            ← Back to Domains
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success State - Show at top when verified */}
        {isFullyVerified && (
          <div className="text-center py-8 mb-8 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-4">
              <IconCircleCheck className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-100 mb-2">
              🎉 Domain Verified!
            </h1>
            <p className="text-text-200 text-sm mb-4">
              Your domain is fully configured and ready to send emails.
            </p>
            <p className="text-text-300 text-xs">
              Below are your DNS records for reference
            </p>
          </div>
        )}

        {/* DNS Records Section - Always show (wizard for unverified, read-only for verified) */}
        {
          <>
            {/* Page Header - Only show for unverified domains */}
            {!isFullyVerified && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-text-100 mb-1">
                    Setup Your Domain
                  </h1>
                  <p className="text-text-300 text-sm">
                    2 easy steps to get started
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary-100">
                      {currentStep}/2
                    </span>
                    <span className="text-sm text-text-300">Steps</span>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        currentStep >= 1 ? "bg-primary-100" : "bg-bg-300"
                      }`}
                    ></div>
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        currentStep >= 2 ? "bg-primary-100" : "bg-bg-300"
                      }`}
                    ></div>
                  </div>
                </div>
              </>
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
            <div className="bg-gradient-to-br from-primary-100/10 to-primary-300/10 rounded-2xl border border-primary-100/20 overflow-hidden mb-6">
              {/* Step Header - Only show for unverified */}
              {!isFullyVerified && (
                <div className="bg-primary-100  p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      {currentStep === 1 && <IconShield className="w-6 h-6" />}
                      {currentStep === 2 && <IconMail className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold opacity-90 mb-1">
                        Step {currentStep} of 2
                      </div>
                      <h2 className="text-xl font-bold">
                        {currentStep === 1 && "Secure Your Emails"}
                        {currentStep === 2 && "Enable Email Sending"}
                      </h2>
                      <p className="text-sm opacity-90 mt-1">
                        {currentStep === 1 &&
                          "Add security records to protect your domain reputation"}
                        {currentStep === 2 &&
                          "Copy these records so you can send emails"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Content */}
              <div className="p-6 bg-white/5">
                {/* For unverified: Show current step only */}
                {!isFullyVerified && currentStep === 1 && (
                  <div className="space-y-4">
                    {/* Custom MAIL FROM - MX Record */}
                    {dns?.dnsRecords?.mailFrom && (
                      <>
                        <CompactDNSRecord
                          recordNumber={1}
                          nameLabel="Name"
                          nameValue={dns.dnsRecords.mailFrom.domain}
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

                        {/* Custom MAIL FROM - SPF Record */}
                        <CompactDNSRecord
                          recordNumber={2}
                          nameLabel="Name"
                          nameValue={dns.dnsRecords.mailFrom.domain}
                          valueLabel="Value"
                          valueValue={dns.dnsRecords.mailFrom.spf.value}
                          type="TXT"
                          copiedIndex={copiedIndex}
                          onCopy={copyToClipboard}
                          nameId="mailspf-name"
                          valueId="mailspf-value"
                        />
                      </>
                    )}

                    {/* Root Domain SPF Record with Tabs */}
                    {dns?.dnsRecords?.spf && (
                      <div className="space-y-3">
                        {/* Show tabs only if existing SPF detected */}
                        {dns.dnsRecords.spf.existing &&
                        dns.dnsRecords.spf.existing.length > 0 ? (
                          <>
                            {/* Tab Navigation */}
                            <div className="flex gap-2 p-1 bg-bg-200/50 rounded-lg border border-bg-300">
                              <button
                                onClick={() => setSpfTab("merge")}
                                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                                  spfTab === "merge"
                                    ? "bg-primary-100 text-white"
                                    : "text-text-300 hover:text-text-100"
                                }`}
                              >
                                Merge with Existing SPF (Recommended)
                              </button>
                              <button
                                onClick={() => setSpfTab("new")}
                                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                                  spfTab === "new"
                                    ? "bg-primary-100 text-white"
                                    : "text-text-300 hover:text-text-100"
                                }`}
                              >
                                Add New SPF Record
                              </button>
                            </div>

                            {/* Tab Content */}
                            {spfTab === "merge" ? (
                              <>
                                <div className="text-xs text-yellow-300 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                                  ⚠️ <strong>Existing SPF detected.</strong>{" "}
                                  Replace your current SPF record with the
                                  merged value below.
                                </div>
                                <CompactDNSRecord
                                  recordNumber={3}
                                  nameLabel="Name"
                                  nameValue={domainInfo?.domain}
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
                                recordNumber={3}
                                nameLabel="Name"
                                nameValue={domainInfo?.domain}
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
                            recordNumber={3}
                            nameLabel="Name"
                            nameValue={domainInfo?.domain}
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
                    {dns?.dnsRecords?.dmarc && (
                      <>
                        {dns.dnsRecords.dmarc.existing ? (
                          <div className="space-y-3">
                            <div className="text-xs text-yellow-300 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                              ⚠️ <strong>Existing DMARC detected.</strong>{" "}
                              Replace your current DMARC record with the merged
                              value below.
                            </div>
                            <CompactDNSRecord
                              recordNumber={4}
                              nameLabel="Name"
                              nameValue={`_dmarc.${domainInfo?.domain}`}
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
                            recordNumber={4}
                            nameLabel="Name"
                            nameValue={`_dmarc.${domainInfo?.domain}`}
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
                  </div>
                )}

                {/* For unverified: Step 2 - Enable Email Sending (DKIM) */}
                {!isFullyVerified && currentStep === 2 && (
                  <div className="space-y-4">
                    {((dns?.dnsRecords?.dkim?.length || 0) > 0 ||
                      (domainInfo?.dkimTokens?.tokens?.length || 0) > 0) && (
                      <div className="space-y-3">
                        {(
                          dns?.dnsRecords?.dkim ||
                          domainInfo?.dkimTokens?.tokens ||
                          []
                        ).map((token: any, index: number) => {
                          const tokenStr =
                            typeof token === "string"
                              ? token
                              : token?.name?.split("._domainkey.")[0];
                          return (
                            <CompactDNSRecord
                              key={index}
                              recordNumber={index + 1}
                              nameLabel="Name"
                              nameValue={`${tokenStr}._domainkey.${domainInfo?.domain}`}
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
                        {dns?.dnsRecords?.mailFrom && (
                          <CompactDNSRecord
                            recordNumber={1}
                            nameLabel="Name"
                            nameValue={dns.dnsRecords.mailFrom.domain}
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

                        {/* Custom MAIL FROM SPF */}
                        {dns?.dnsRecords?.mailFrom && (
                          <CompactDNSRecord
                            recordNumber={2}
                            nameLabel="Name"
                            nameValue={dns.dnsRecords.mailFrom.domain}
                            valueLabel="Value"
                            valueValue={dns.dnsRecords.mailFrom.spf.value}
                            type="TXT"
                            copiedIndex={copiedIndex}
                            onCopy={copyToClipboard}
                            nameId="mailspf-name-verified"
                            valueId="mailspf-value-verified"
                          />
                        )}

                        {/* Root SPF */}
                        {dns?.dnsRecords?.spf && (
                          <CompactDNSRecord
                            recordNumber={3}
                            nameLabel="Name"
                            nameValue={domainInfo?.domain}
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
                        {dns?.dnsRecords?.dmarc && (
                          <CompactDNSRecord
                            recordNumber={4}
                            nameLabel="Name"
                            nameValue={`_dmarc.${domainInfo?.domain}`}
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
                              return (
                                <CompactDNSRecord
                                  key={index}
                                  recordNumber={index + 1}
                                  nameLabel="Name"
                                  nameValue={`${tokenStr}._domainkey.${domainInfo?.domain}`}
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

            {/* Navigation Buttons - Only show for unverified */}
            {!isFullyVerified && (
              <div className="flex items-center justify-between gap-4 mb-6">
                {currentStep > 1 && (
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    className="border-bg-300 text-text-200 hover:bg-bg-200 transition-colors"
                  >
                    ← Back
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="bg-primary-100 hover:bg-primary-100/90 text-white ml-auto transition-colors"
                  >
                    Continue →
                  </Button>
                ) : (
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white ml-auto transition-colors"
                  >
                    {loading ? (
                      "Checking..."
                    ) : (
                      <>
                        <IconCircleCheck className="w-4 h-4 mr-2" />
                        Verify & Complete
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Info Section - Only show for unverified */}
            {!isFullyVerified && (
              <div className="bg-bg-200/30 border border-bg-300 rounded-xl p-6">
                <h3 className="text-text-100 font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-main"></div>
                  Quick Setup Guide
                </h3>
                <ul className="space-y-3 text-sm text-text-200">
                  <li className="flex gap-3">
                    <span className="text-brand-main font-bold">1.</span>
                    <span>
                      Copy each DNS record above (click the copy button)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-main font-bold">2.</span>
                    <span>
                      Log in to your domain provider (GoDaddy, Namecheap,
                      Cloudflare, etc.)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-main font-bold">3.</span>
                    <span>Add the records to your DNS settings</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-main font-bold">4.</span>
                    <span>
                      Wait 5-30 minutes for DNS propagation (can take up to 72
                      hours)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-main font-bold">5.</span>
                    <span>
                      Click "Verify & Complete" above to check your setup
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </>
        }
      </main>
    </div>
  );
}
