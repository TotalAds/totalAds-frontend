"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import emailClient from "@/utils/api/emailClient";
import {
  IconArrowLeft,
  IconCheck,
  IconLoader,
  IconMail,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface Props {
  domainId: string | number | bigint;
  domainName?: string;
  onBack: () => void;
}

interface Sender {
  id: string;
  email: string;
  displayName?: string;
  verificationStatus: "pending" | "verified" | "failed";
  createdAt?: string;
}

interface Domain {
  id: string;
  domain: string;
  verificationStatus: "pending" | "verified" | "failed";
  dkimStatus: "pending" | "verified" | "failed";
}

export default function DomainSendersPanel({
  domainId,
  domainName,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [domain, setDomain] = useState<Domain | null>(null);

  const domainPart = useMemo(() => domainName || "", [domainName]);

  useEffect(() => {
    fetchDomain();
    fetchSenders();
  }, [domainId]);

  const fetchDomain = async () => {
    try {
      const res = await emailClient.get(`/api/domains/${domainId}`);
      const data = res?.data?.data ?? res?.data;
      setDomain(data);
    } catch (error: any) {
      console.error("Failed to load domain:", error);
    }
  };

  const fetchSenders = async () => {
    try {
      setLoading(true);
      const res = await emailClient.get(
        `/api/email-senders?domainId=${domainId}`
      );
      const data = res?.data?.data ?? res?.data;
      setSenders(data?.senders || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load senders");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSender = async () => {
    // Check if domain is verified
    if (
      !domain ||
      domain.verificationStatus !== "verified" ||
      domain.dkimStatus !== "verified"
    ) {
      toast.error(
        "Your domain must be fully verified before adding senders. Please verify your domain first."
      );
      return;
    }

    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!newDisplayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    if (domainPart && !newEmail.endsWith(`@${domainPart}`)) {
      toast.error(`Email must belong to @${domainPart}`);
      return;
    }

    try {
      setCreating(true);
      const res = await emailClient.post("/api/email-senders", {
        email: newEmail,
        displayName: newDisplayName,
        domainId,
      });
      if (res?.data?.success) {
        toast.success("Sender added");
        setNewEmail("");
        setNewDisplayName("");
        await fetchSenders();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add sender");
    } finally {
      setCreating(false);
    }
  };

  const handleVerifySender = async (senderId: string) => {
    try {
      const res = await emailClient.post(
        `/api/email-senders/${senderId}/verify`,
        {}
      );
      if (res?.data?.success) {
        toast.success("Verification requested");
        await fetchSenders();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to verify sender");
    }
  };

  const handleDeleteSender = async (senderId: string) => {
    if (!confirm("Delete this sender?")) return;
    try {
      const res = await emailClient.delete(`/api/email-senders/${senderId}`);
      if (res?.data?.success) {
        toast.success("Sender deleted");
        setSenders((prev) => prev.filter((s) => s.id !== senderId));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete sender");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-100">Email Senders</h2>
          {domainName && (
            <p className="text-text-200 text-sm mt-1">
              Manage senders for{" "}
              <span className="font-mono text-brand-main">{domainName}</span>
            </p>
          )}
        </div>
        <Button onClick={onBack} variant="outline" className="text-sm">
          <IconArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {/* Domain Verification Status */}
      {domain &&
        (domain.verificationStatus === "verified" &&
        domain.dkimStatus === "verified" ? (
          <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/10">
            <div className="flex items-center gap-2">
              <IconCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold text-sm">
                  Domain Verified
                </p>
                <p className="text-green-300/80 text-xs mt-1">
                  Your domain is verified. You can now add senders.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/10">
            <div className="flex items-center gap-2">
              <IconX className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold text-sm">
                  Domain Not Verified
                </p>
                <p className="text-red-300/80 text-xs mt-1">
                  Please verify your domain before adding senders. Go back and
                  complete domain verification.
                </p>
              </div>
            </div>
          </div>
        ))}

      {/* Create sender */}
      <div className="border border-brand-main/20 rounded-lg p-6 bg-gradient-to-br from-bg-300/50 to-bg-200/30">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-100">
            Add New Sender
          </h3>
          <p className="text-text-200 text-sm mt-1">
            Create a new email sender for this domain
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-100 mb-2">
              Email Address
            </label>
            <Input
              placeholder={
                domainPart ? `name@${domainPart}` : "name@example.com"
              }
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              containerClass="flex flex-1"
              disabled={
                !domain ||
                domain.verificationStatus !== "verified" ||
                domain.dkimStatus !== "verified"
              }
            />
            {domainPart && (
              <p className="text-text-300 text-xs mt-2">
                Email must belong to{" "}
                <span className="font-mono">@{domainPart}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-100 mb-2">
              Sender Name (Display Name)
            </label>
            <Input
              placeholder="Enter the name you want recipients to see in their inbox"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              containerClass="flex flex-1"
              disabled={
                !domain ||
                domain.verificationStatus !== "verified" ||
                domain.dkimStatus !== "verified"
              }
            />
            <p className="text-text-300 text-xs mt-2">
              This name will appear in recipients' inboxes as the sender
            </p>
          </div>

          <Button
            onClick={handleAddSender}
            disabled={
              creating ||
              !domain ||
              domain.verificationStatus !== "verified" ||
              domain.dkimStatus !== "verified"
            }
            className="w-full bg-brand-main hover:bg-brand-main/90 text-white text-sm py-3"
          >
            {creating ? (
              <>
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                Adding Sender...
              </>
            ) : (
              <>
                <IconMail className="w-4 h-4 mr-2" />
                Add Sender
              </>
            )}
          </Button>

          {(!domain ||
            domain.verificationStatus !== "verified" ||
            domain.dkimStatus !== "verified") && (
            <p className="text-yellow-400/80 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              ⚠️ Domain must be fully verified before adding senders
            </p>
          )}
        </div>
      </div>

      {/* List senders */}
      <div className="border border-brand-main/20 rounded-lg p-6 bg-bg-300/30">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text-100">
            Active Senders
          </h3>
          <p className="text-text-200 text-sm mt-1">
            {senders.length} sender{senders.length !== 1 ? "s" : ""} configured
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
            <p className="text-text-200 text-sm mt-2">Loading senders...</p>
          </div>
        ) : senders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-brand-main/20 rounded-lg">
            <IconMail className="w-8 h-8 text-text-300 mx-auto mb-2" />
            <p className="text-text-200 text-sm">No senders yet</p>
            <p className="text-text-300 text-xs mt-1">
              Add your first sender above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center justify-between border border-brand-main/20 rounded-lg p-4 bg-bg-200/50 hover:bg-bg-200/80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-brand-main/10 flex items-center justify-center">
                    <IconMail className="w-5 h-5 text-brand-main" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-100 font-medium text-sm">
                      {sender.displayName && <span>{sender.displayName} </span>}
                      <span className="text-text-200">
                        &lt;{sender.email}&gt;
                      </span>
                    </p>
                    {sender.createdAt && (
                      <p className="text-text-300 text-xs">
                        Added {new Date(sender.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  {sender.verificationStatus === "verified" ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <IconCheck className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                      <IconLoader className="w-3 h-3 text-yellow-400 animate-spin" />
                      <span className="text-xs text-yellow-400 font-medium">
                        Pending
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {sender.verificationStatus === "pending" && (
                    <Button
                      onClick={() => handleVerifySender(sender.id)}
                      className="bg-brand-main hover:bg-brand-main/90 text-white text-xs py-1 px-3"
                    >
                      <IconCheck className="w-3 h-3 mr-1" /> Check Status
                    </Button>
                  )}

                  <button
                    onClick={() => handleDeleteSender(sender.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete sender"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
