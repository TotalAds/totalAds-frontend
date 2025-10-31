"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import emailClient from "@/utils/api/emailClient";
import { IconArrowLeft, IconCheck, IconClock, IconLoader, IconX } from "@tabler/icons-react";

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

export default function DomainVerifyPanel({ domainId, domainName, onBack, onRefreshParent }: Props) {
  const [loading, setLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);

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
      toast.error(error?.response?.data?.message || "Failed to load domain details");
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-100">Verify Domain</h3>
          <p className="text-text-200 text-sm">{domainInfo?.domain || domainName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="text-sm">
            <IconArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleCheckStatus} disabled={loading} className="bg-brand-main text-white text-sm">
            {loading ? <IconLoader className="w-4 h-4 mr-2 animate-spin" /> : <IconCheck className="w-4 h-4 mr-2" />}
            Check Verification Status
          </Button>
        </div>
      </div>

      {domainInfo && (
        <div className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50">
          <div className="flex items-center gap-2 text-sm">
            <span>Domain:</span>
            <span className="font-medium">{domainInfo.domain}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span>Status:</span>
            {statusBadge(domainInfo.verificationStatus)}
            {statusBadge(domainInfo.dkimStatus)}
          </div>
        </div>
      )}

      {/* DNS Records */}
      <div className="border border-brand-main/20 rounded-lg p-4 bg-brand-main/10">
        <h4 className="text-brand-main font-semibold mb-3">DNS Records to Add</h4>
        <p className="text-text-200 text-sm mb-4">Add these records to your DNS provider:</p>

        {/* TXT record */}
        {dns?.dnsRecords?.txt?.value && (
          <div className="mb-4">
            <p className="text-text-200 font-semibold mb-2">TXT Record (Domain Identity)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-brand-main">Name:</span> {dns?.dnsRecords?.txt?.name || "@"}
              </div>
              <div>
                <span className="text-brand-main">Value:</span> {dns?.dnsRecords?.txt?.value}
              </div>
              <div>
                <span className="text-brand-main">Type:</span> TXT
              </div>
            </div>
          </div>
        )}

        {/* DKIM CNAMEs */}
        {(
          (dns?.dnsRecords?.dkim?.length || 0) > 0
            ? dns?.dnsRecords?.dkim
            : domainInfo?.dkimTokens?.tokens || []
        )?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-text-200 font-semibold">DKIM Records (3 CNAME records)</p>
            {(
              dns?.dnsRecords?.dkim || domainInfo?.dkimTokens?.tokens
            )?.map((token: any, idx: number) => {
              const tokenStr = typeof token === "string" ? token : token?.value;
              const name = `${tokenStr}._domainkey.${domainInfo?.domain || domainName}`;
              const value = `smtp.${tokenStr}.amazonses.com`;
              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-brand-main">Name:</span> {name}
                  </div>
                  <div>
                    <span className="text-brand-main">Value:</span> {value}
                  </div>
                  <div>
                    <span className="text-brand-main">Type:</span> CNAME
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!dns && (
          <div className="text-center py-6">
            <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
          </div>
        )}
      </div>

      <div className="text-xs text-text-200">Tip: DNS propagation can take 5–30 minutes (up to 72h). Check status periodically.</div>
    </div>
  );
}

