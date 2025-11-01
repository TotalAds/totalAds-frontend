"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconLoader,
  IconX,
} from "@tabler/icons-react";

import DNSRecordsModal from "./DNSRecordsModal";

interface Props {
  domainId: string | number | bigint;
  domainName?: string;
  onBack: () => void;
  onRefreshParent?: () => void;
}

const statusBadge = (label: string) => {
  switch (label) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
          <IconCheck className="w-3 h-3" /> Verified
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
          <IconClock className="w-3 h-3" /> Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
          <IconX className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return null;
  }
};

export default function DomainVerifyPanel({
  domainId,
  domainName,
  onBack,
  onRefreshParent,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);
  const [showDNSModal, setShowDNSModal] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [domainId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [infoRes, dnsRes] = await Promise.all([
        emailClient.get(`/api/domains/${domainId}`),
        emailClient.get(`/api/domains/${domainId}/dns-records`),
      ]);
      const info = infoRes?.data?.data ?? infoRes?.data;
      const dnsData = dnsRes?.data?.data ?? dnsRes?.data;
      setDomainInfo(info);
      setDns(dnsData);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load domain details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setLoading(true);
      const res = await emailClient.post(`/api/domains/${domainId}/verify`, {});
      const data = res?.data?.data ?? res?.data;
      if (data?.message) toast.success(data.message);
      await fetchAll();
      onRefreshParent?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to verify domain");
    } finally {
      setLoading(false);
    }
  };

  const isVerified =
    domainInfo?.verificationStatus === "verified" &&
    domainInfo?.dkimStatus === "verified";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-100">Verify Domain</h3>
          <p className="text-text-200 text-sm">
            {domainInfo?.domain || domainName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="text-sm">
            <IconArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {!isVerified && (
            <Button
              onClick={handleCheckStatus}
              disabled={loading}
              className="bg-brand-main text-white text-sm"
            >
              {loading ? (
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <IconCheck className="w-4 h-4 mr-2" />
              )}
              Check Verification Status
            </Button>
          )}
        </div>
      </div>

      {domainInfo && (
        <div className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50">
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-text-200">Domain:</span>
            <span className="font-medium text-text-100">
              {domainInfo.domain}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-200">Status:</span>
            <div className="flex gap-2">
              {statusBadge(domainInfo.verificationStatus)}
              {statusBadge(domainInfo.dkimStatus)}
            </div>
          </div>
        </div>
      )}

      {/* Verification Status Message */}
      {isVerified ? (
        <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/10">
          <div className="flex items-center gap-2">
            <IconCheck className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-semibold text-sm">
                Domain Verified Successfully
              </p>
              <p className="text-green-300/80 text-xs mt-1">
                Your domain is fully verified and ready to use for sending
                emails.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-yellow-500/20 rounded-lg p-4 bg-yellow-500/10">
          <div className="flex items-center gap-2">
            <IconClock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">
                Verification Pending
              </p>
              <p className="text-yellow-300/80 text-xs mt-1">
                Add the DNS records below to your DNS provider and check status
                periodically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View DNS Records Button */}
      <Button
        onClick={() => setShowDNSModal(true)}
        className="w-full bg-brand-main hover:bg-brand-main/90 text-white"
      >
        View DNS Records
      </Button>

      {/* DNS Records Modal */}
      <DNSRecordsModal
        isOpen={showDNSModal}
        onClose={() => setShowDNSModal(false)}
        domainName={domainInfo?.domain || domainName}
        domainInfo={domainInfo}
        dnsRecords={dns}
      />
    </div>
  );
}
