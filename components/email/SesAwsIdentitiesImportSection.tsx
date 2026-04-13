"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { IconCloudDownload } from "@tabler/icons-react";

import {
  discoverSesIdentitiesFromAws,
  type DiscoverSesIdentitiesData,
  getEmailServiceErrorMessage,
  importSesIdentitiesFromAws,
} from "@/utils/api/emailClient";

export type SesAwsIdentitiesImportSectionProps = {
  className?: string;
  /** After a successful import and identity list refresh */
  onImportComplete?: () => void | Promise<void>;
};

/**
 * BYO SES: load SES identities from the user's AWS account and import domains/senders into LeadSnipper.
 * Used from Settings (Email delivery) and the Email Domains page.
 */
export function SesAwsIdentitiesImportSection({
  className = "",
  onImportComplete,
}: SesAwsIdentitiesImportSectionProps) {
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverData, setDiscoverData] = useState<DiscoverSesIdentitiesData | null>(null);
  const [selectedAwsDomains, setSelectedAwsDomains] = useState<Set<string>>(() => new Set());
  const [selectedAwsEmails, setSelectedAwsEmails] = useState<Set<string>>(() => new Set());
  const [importingIdentities, setImportingIdentities] = useState(false);

  const handleDiscoverAws = async () => {
    setDiscoverLoading(true);
    setDiscoverError(null);
    try {
      const data = await discoverSesIdentitiesFromAws();
      if (!data) {
        setDiscoverError("Could not load identities from AWS.");
        return;
      }
      setDiscoverData(data);
      setSelectedAwsDomains(new Set());
      setSelectedAwsEmails(new Set());
    } catch (e: unknown) {
      setDiscoverError(getEmailServiceErrorMessage(e, "Failed to load from AWS"));
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleImportSelected = async () => {
    const domains = [...selectedAwsDomains];
    const senders = [...selectedAwsEmails].map((email) => ({ email }));
    if (domains.length === 0 && senders.length === 0) {
      toast.error("Select at least one domain or email to import.");
      return;
    }
    setImportingIdentities(true);
    try {
      const result = await importSesIdentitiesFromAws({ domains, senders });
      const nImported =
        result.importedDomains.length + result.importedSenders.length;
      if (nImported > 0) {
        toast.success(
          `Imported ${result.importedDomains.length} domain(s) and ${result.importedSenders.length} sender(s).`,
        );
      }
      const skipN = result.skipped.length;
      if (skipN > 0) {
        setDiscoverError(
          result.skipped.map((s) => `${s.item}: ${s.reason}`).join("\n"),
        );
        if (nImported === 0) {
          toast.error("Nothing was imported. Details are shown below the table.");
        } else {
          toast("Some selections could not be imported (see details below).", {
            duration: 5000,
          });
        }
      } else {
        setDiscoverError(null);
      }
      await onImportComplete?.();
      const data = await discoverSesIdentitiesFromAws();
      if (data) setDiscoverData(data);
      setSelectedAwsDomains(new Set());
      setSelectedAwsEmails(new Set());
    } catch (e: unknown) {
      toast.error(getEmailServiceErrorMessage(e, "Import failed"));
    } finally {
      setImportingIdentities(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start gap-2">
        <IconCloudDownload className="w-5 h-5 text-brand-main shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-text-100">Import domains and senders from AWS</h3>
          <p className="text-sm text-text-200 mt-1">
            We read your verified SES identities in this region and show what is already in
            LeadSnipper. Select what you want to import — no need to re-type domains or senders.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDiscoverAws()}
          disabled={discoverLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 disabled:opacity-50"
        >
          {discoverLoading ? "Loading from AWS…" : "Load from AWS"}
        </button>
        {discoverData && (
          <button
            type="button"
            onClick={() => void handleImportSelected()}
            disabled={
              importingIdentities ||
              (selectedAwsDomains.size === 0 && selectedAwsEmails.size === 0)
            }
            className="px-4 py-2 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 disabled:opacity-50"
          >
            {importingIdentities ? "Importing…" : "Import selected"}
          </button>
        )}
      </div>

      {discoverError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <pre className="text-xs text-text-200 whitespace-pre-wrap font-sans m-0">{discoverError}</pre>
        </div>
      )}

      {discoverData && (
        <>
          <div className="p-3 rounded-lg bg-bg-300/50 border border-bg-200 space-y-2">
            <p className="text-xs font-medium text-text-100">
              SNS + SES wiring (same checks as &quot;Verify setup&quot;)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-text-200">
              <span>
                Topic:{" "}
                <span
                  className={
                    discoverData.snsIntegration.snsTopicExists ? "text-green-600" : "text-amber-600"
                  }
                >
                  {discoverData.snsIntegration.snsTopicExists ? "OK" : "Missing"}
                </span>
              </span>
              <span>
                HTTPS sub:{" "}
                <span
                  className={
                    discoverData.snsIntegration.subscriptionConfirmed
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {discoverData.snsIntegration.subscriptionConfirmed
                    ? "Confirmed"
                    : "Pending / missing"}
                </span>
              </span>
              <span>
                Config set:{" "}
                <span
                  className={
                    discoverData.snsIntegration.configurationSetExists
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {discoverData.snsIntegration.configurationSetExists ? "OK" : "Missing"}
                </span>
              </span>
              <span className="sm:col-span-2">
                SES → SNS destination:{" "}
                <span
                  className={
                    discoverData.snsIntegration.eventDestinationExists
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {discoverData.snsIntegration.eventDestinationExists
                    ? "Connected"
                    : "Not connected"}
                </span>
              </span>
            </div>
            {discoverData.snsIntegration.error && (
              <p className="text-[11px] text-red-600">{discoverData.snsIntegration.error}</p>
            )}
          </div>

          <div className="overflow-x-auto border border-bg-200 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg-300/80 text-xs text-text-300">
                <tr>
                  <th className="p-2 w-10" />
                  <th className="p-2">Identity</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">SES status</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {discoverData.domains.map((d) => (
                  <tr key={`d-${d.identity}`} className="border-t border-bg-200">
                    <td className="p-2 align-top">
                      <input
                        type="checkbox"
                        className="rounded border-bg-200"
                        disabled={d.alreadyImported}
                        checked={selectedAwsDomains.has(d.identity)}
                        onChange={() => {
                          setSelectedAwsDomains((prev) => {
                            const n = new Set(prev);
                            if (n.has(d.identity)) n.delete(d.identity);
                            else n.add(d.identity);
                            return n;
                          });
                        }}
                      />
                    </td>
                    <td className="p-2 font-mono text-xs text-text-100">{d.identity}</td>
                    <td className="p-2 text-text-200">Domain</td>
                    <td className="p-2 text-text-200 text-xs">
                      {d.verificationStatus}
                      <span className="text-text-300"> · DKIM </span>
                      {d.dkimStatus}
                    </td>
                    <td className="p-2 text-xs text-text-300">
                      {d.alreadyImported
                        ? "Already in LeadSnipper"
                        : d.readyForSending
                          ? "Ready to send from SES"
                          : "Finish DNS verification in SES if needed"}
                    </td>
                  </tr>
                ))}
                {discoverData.emailAddresses.map((e) => (
                  <tr key={`e-${e.email}`} className="border-t border-bg-200">
                    <td className="p-2 align-top">
                      <input
                        type="checkbox"
                        className="rounded border-bg-200"
                        disabled={e.alreadyImported || !e.canImport}
                        checked={selectedAwsEmails.has(e.email)}
                        onChange={() => {
                          setSelectedAwsEmails((prev) => {
                            const n = new Set(prev);
                            if (n.has(e.email)) n.delete(e.email);
                            else n.add(e.email);
                            return n;
                          });
                        }}
                      />
                    </td>
                    <td className="p-2 font-mono text-xs text-text-100">{e.email}</td>
                    <td className="p-2 text-text-200">Email</td>
                    <td className="p-2 text-text-200 text-xs">{e.verificationStatus}</td>
                    <td className="p-2 text-xs text-text-300">
                      {e.alreadyImported
                        ? "Already in LeadSnipper"
                        : [e.importHint, !e.canImport ? "Cannot import yet." : null]
                            .filter(Boolean)
                            .join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-text-300">
            Tip: import domains first if you want both a domain and addresses on that domain.
            Email identities must be verified in SES (Success) before we can add them as senders.
          </p>
        </>
      )}
    </div>
  );
}
