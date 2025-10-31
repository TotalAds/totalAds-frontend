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
} from "@tabler/icons-react";

interface Props {
  domainId: string | number | bigint;
  domainName?: string;
  onBack: () => void;
}

interface Sender {
  id: string;
  email: string;
  verificationStatus: "pending" | "verified" | "failed";
  createdAt?: string;
}

export default function DomainSendersPanel({
  domainId,
  domainName,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const domainPart = useMemo(() => domainName || "", [domainName]);

  useEffect(() => {
    fetchSenders();
  }, [domainId]);

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
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
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
        domainId,
      });
      if (res?.data?.success) {
        toast.success("Sender added");
        setNewEmail("");
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-100">Email Senders</h3>
          {domainName && (
            <p className="text-text-200 text-sm">Domain: {domainName}</p>
          )}
        </div>
        <Button onClick={onBack} variant="outline" className="text-sm">
          <IconArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {/* Create sender */}
      <div className="border border-brand-main/20 rounded-lg p-4 bg-bg-300/50">
        <label className="block text-sm font-medium text-text-100 mb-2">
          New sender email
        </label>
        <div className="flex gap-2 items-center">
          <Input
            placeholder={domainPart ? `name@${domainPart}` : "name@example.com"}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            containerClass="flex flex-1 "
          />
          <Button
            onClick={handleAddSender}
            disabled={creating}
            className="bg-brand-main text-white text-sm"
          >
            {creating ? (
              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <IconMail className="w-4 h-4 mr-2" />
            )}
            Add Sender
          </Button>
        </div>
      </div>

      {/* List senders */}
      <div className="border border-brand-main/20 rounded-lg p-4">
        {loading ? (
          <div className="text-center py-6">
            <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
          </div>
        ) : senders.length === 0 ? (
          <div className="text-sm text-text-200">No senders yet.</div>
        ) : (
          <div className="space-y-2">
            {senders.map((sender) => (
              <div
                key={sender.id}
                className="flex items-center justify-between border border-brand-main/20 rounded-md p-3"
              >
                <div className="flex items-center gap-2">
                  <IconMail className="w-4 h-4 text-brand-main" />
                  <span className="text-text-100 text-sm">{sender.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-200">
                    {sender.verificationStatus}
                  </span>
                  {sender.verificationStatus === "pending" && (
                    <Button
                      onClick={() => handleVerifySender(sender.id)}
                      className="bg-brand-main text-white text-xs"
                    >
                      <IconCheck className="w-3 h-3 mr-1" /> Check Status
                    </Button>
                  )}
                  <div
                    onClick={() => handleDeleteSender(sender.id)}
                    className="text-red-400 p-2 py-1"
                  >
                    <IconTrash size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
