"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconCheck, IconClock, IconCopy, IconX } from "@tabler/icons-react";

interface DNSRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName?: string;
  domainInfo?: any;
  dnsRecords?: any;
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

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export default function DNSRecordsModal({
  isOpen,
  onClose,
  domainName,
  domainInfo,
  dnsRecords,
}: DNSRecordsModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, index: string) => {
    copyToClipboard(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-200 border-brand-main/20">
        <DialogHeader>
          <DialogTitle className="text-text-100">
            DNS Records for {domainName || domainInfo?.domain}
          </DialogTitle>
        </DialogHeader>

        {/* Domain Status */}
        {domainInfo && (
          <div className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50">
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-text-200">Status:</span>
              <div className="flex gap-2">
                {statusBadge(domainInfo.verificationStatus)}
                {statusBadge(domainInfo.dkimStatus)}
              </div>
            </div>
          </div>
        )}

        {/* DNS Records Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-brand-main font-semibold mb-2 text-sm">
              Add these records to your DNS provider:
            </h4>
            <p className="text-text-200 text-xs mb-4">
              DNS propagation can take 5–30 minutes (up to 72h). Copy each record and add it to your DNS provider.
            </p>
          </div>

          {/* TXT Record */}
          {dnsRecords?.dnsRecords?.txt?.value && (
            <div className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50">
              <h5 className="text-text-100 font-semibold mb-3 text-sm">
                TXT Record (Domain Identity)
              </h5>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-text-200 text-xs mb-1">Name:</p>
                    <p className="text-text-100 text-sm font-mono break-all">
                      {dnsRecords?.dnsRecords?.txt?.name || "@"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(dnsRecords?.dnsRecords?.txt?.name || "@", "txt-name")
                    }
                    className="text-xs"
                  >
                    {copiedIndex === "txt-name" ? (
                      <IconCheck className="w-3 h-3" />
                    ) : (
                      <IconCopy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-text-200 text-xs mb-1">Value:</p>
                    <p className="text-text-100 text-xs font-mono break-all bg-bg-300/50 p-2 rounded">
                      {dnsRecords?.dnsRecords?.txt?.value}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(dnsRecords?.dnsRecords?.txt?.value, "txt-value")
                    }
                    className="text-xs"
                  >
                    {copiedIndex === "txt-value" ? (
                      <IconCheck className="w-3 h-3" />
                    ) : (
                      <IconCopy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div>
                  <p className="text-text-200 text-xs mb-1">Type:</p>
                  <p className="text-text-100 text-sm font-semibold">TXT</p>
                </div>
              </div>
            </div>
          )}

          {/* DKIM Records */}
          {(
            (dnsRecords?.dnsRecords?.dkim?.length || 0) > 0
              ? dnsRecords?.dnsRecords?.dkim
              : domainInfo?.dkimTokens?.tokens || []
          )?.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-text-100 font-semibold text-sm">
                DKIM Records (3 CNAME records)
              </h5>
              {(
                dnsRecords?.dnsRecords?.dkim || domainInfo?.dkimTokens?.tokens
              )?.map((token: any, idx: number) => {
                const tokenStr = typeof token === "string" ? token : token?.value;
                const name = `${tokenStr}._domainkey.${domainInfo?.domain || domainName}`;
                const value = `smtp.${tokenStr}.amazonses.com`;
                return (
                  <div
                    key={idx}
                    className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50"
                  >
                    <p className="text-text-200 text-xs mb-2">
                      DKIM Record {idx + 1}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-text-200 text-xs mb-1">Name:</p>
                          <p className="text-text-100 text-xs font-mono break-all bg-bg-300/50 p-2 rounded">
                            {name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(name, `dkim-name-${idx}`)}
                          className="text-xs"
                        >
                          {copiedIndex === `dkim-name-${idx}` ? (
                            <IconCheck className="w-3 h-3" />
                          ) : (
                            <IconCopy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-text-200 text-xs mb-1">Value:</p>
                          <p className="text-text-100 text-xs font-mono break-all bg-bg-300/50 p-2 rounded">
                            {value}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(value, `dkim-value-${idx}`)}
                          className="text-xs"
                        >
                          {copiedIndex === `dkim-value-${idx}` ? (
                            <IconCheck className="w-3 h-3" />
                          ) : (
                            <IconCopy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <div>
                        <p className="text-text-200 text-xs mb-1">Type:</p>
                        <p className="text-text-100 text-sm font-semibold">CNAME</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={onClose}
            className="bg-brand-main hover:bg-brand-main/90 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

