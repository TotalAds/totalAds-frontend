"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import DomainSendersPanel from "@/components/settings/domains/DomainSendersPanel";
import DomainVerifyPanel from "@/components/settings/domains/DomainVerifyPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import emailClient from "@/utils/api/emailClient";
import {
  IconCheck,
  IconClock,
  IconLoader,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface Domain {
  id: string;
  domain: string;
  verificationStatus: "pending" | "verified" | "failed";
  dkimStatus: "pending" | "verified" | "failed";
  sendingEnabled: boolean;
  createdAt: string;
}

const DomainsSection = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<"list" | "verify" | "senders">("list");
  const [selected, setSelected] = useState<Domain | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const response = await emailClient.get("/api/domains");
      // Normalize response envelope - handle multiple possible structures
      const rawResponse = response?.data.data.domains;
      let domainsList: Domain[] = [];

      if (Array.isArray(rawResponse)) {
        domainsList = rawResponse;
      } else if (Array.isArray(rawResponse?.data)) {
        domainsList = rawResponse.data;
      } else if (Array.isArray(rawResponse?.payload?.data)) {
        domainsList = rawResponse.payload.data;
      }
      console.log(response, "---------------------");
      setDomains(domainsList);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch domains");
      setDomains([]); // Ensure domains is always an array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    setIsAdding(true);
    try {
      const response = await emailClient.post("/api/domains", {
        domain: newDomain,
      });
      const created = response?.data?.data ?? response?.data;
      setDomains([...domains, created]);
      setNewDomain("");
      setShowAddForm(false);
      toast.success("Domain added successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add domain");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;

    try {
      await emailClient.delete(`/api/domains/${domainId}`);
      setDomains(domains.filter((d) => d.id !== domainId));
      toast.success("Domain deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete domain");
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await emailClient.post(`/api/domains/${domainId}/verify`, {});
      const data = res?.data?.data ?? res?.data;
      if (data) {
        toast.success(
          data?.message ||
            "Verification request sent. Status will update shortly."
        );
        await fetchDomains();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to verify domain");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            <IconCheck className="w-3 h-3" />
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
            <IconClock className="w-3 h-3" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <IconX className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-100">Email Domains</h2>
          <p className="text-text-200 text-sm mt-1">
            Manage your verified email domains
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-main hover:bg-brand-main/90 text-white py-3 px-4 text-sm"
        >
          <IconPlus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <div className="rounded-xl border border-brand-main/10 p-5 space-y-4 bg-bg-300/40 shadow-sm">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-100 uppercase tracking-wide">
              Domain Name
            </label>
            <Input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="w-full"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAddDomain}
              disabled={isAdding}
              className="flex-1 bg-brand-main hover:bg-brand-main/90 text-white py-3 px-4 text-sm"
            >
              {isAdding ? (
                <>
                  <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <IconCheck className="w-4 h-4 mr-2" />
                  Add Domain
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              className="flex-1 py-3 px-4 text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Domains Section */}
      {mode === "list" ? (
        isLoading ? (
          <div className="text-center py-8">
            <IconLoader className="w-6 h-6 animate-spin mx-auto text-brand-main" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-main/20 rounded-xl bg-bg-300/40">
            <p className="text-text-200 text-sm">No domains added yet</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="mt-4 bg-brand-main hover:bg-brand-main/90 text-white py-3 px-4 text-sm"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Add Your First Domain
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains?.map((domain) => (
              <div
                key={domain.id}
                className="rounded-xl border border-brand-main/10 p-5 flex items-center justify-between hover:bg-bg-300/50 transition-colors shadow-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-100">{domain.domain}</p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(domain.verificationStatus)}
                    {getStatusBadge(domain.dkimStatus)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.verificationStatus !== "verified" &&
                    domain.dkimStatus !== "verified" && (
                      <Button
                        onClick={() => handleVerifyDomain(domain.id)}
                        variant="outline"
                        className="py-2 px-3 text-sm"
                      >
                        Verify
                      </Button>
                    )}

                  <Button
                    variant="outline"
                    className="py-2 px-3 text-sm"
                    onClick={() => {
                      setSelected(domain);
                      setMode("verify");
                    }}
                  >
                    View DNS
                  </Button>
                  <Button
                    variant="outline"
                    className="py-2 px-3 text-sm"
                    onClick={() => {
                      setSelected(domain);
                      setMode("senders");
                    }}
                  >
                    Manage Senders
                  </Button>
                  <Button
                    onClick={() => handleDeleteDomain(domain.id)}
                    variant="outline"
                    className="text-red-400 hover:text-red-300 py-2 px-3 text-sm"
                  >
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : mode === "verify" && selected ? (
        <DomainVerifyPanel
          domainId={selected.id as any}
          domainName={selected.domain}
          onBack={() => {
            setMode("list");
            setSelected(null);
          }}
          onRefreshParent={fetchDomains}
        />
      ) : mode === "senders" && selected ? (
        <DomainSendersPanel
          domainId={selected.id as any}
          domainName={selected.domain}
          onBack={() => {
            setMode("list");
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default DomainsSection;
