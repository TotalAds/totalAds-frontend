"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import {
  AddSendingAccountModal,
  type AddSendingAccountModalStep,
} from "@/components/email/AddSendingAccountModal";
import { DomainAuthSetupDialog } from "@/components/email/DomainAuthSetupDialog";
import { SenderHealthPanel } from "@/components/email/SenderHealthPanel";
import { SendingAccountsTable } from "@/components/email/SendingAccountsTable";
import { SmtpBulkImportBanner } from "@/components/email/SmtpBulkImportBanner";
import { Button } from "@/components/ui/button";
import {
  checkActiveSmtpBulkImportJobs,
  deleteSendingAccount,
  listSendingAccounts,
  SendingAccount,
  updateSendingAccount,
} from "@/utils/api/emailClient";

export default function SendingAccountsPage() {
  const searchParams = useSearchParams();
  const didAutoConnect = useRef(false);
  const [accounts, setAccounts] = useState<SendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalStep, setAddModalStep] = useState<AddSendingAccountModalStep>("pick");
  const [addModalOAuthProvider, setAddModalOAuthProvider] = useState<
    "gmail" | "outlook" | "zoho" | null
  >(null);
  const [dnsSetupAccount, setDnsSetupAccount] = useState<SendingAccount | null>(null);
  const [bulkImportJobIds, setBulkImportJobIds] = useState<string[]>([]);
  const [view, setView] = useState<"accounts" | "health">("accounts");

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listSendingAccounts();
      setAccounts(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load sending accounts";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBulkImportBanners = useCallback(async () => {
    try {
      const jobs = await checkActiveSmtpBulkImportJobs();
      setBulkImportJobIds(jobs.map((j) => j.id));
    } catch {
      // Non-blocking — page still works without banners
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    void restoreBulkImportBanners();
  }, [fetchAccounts, restoreBulkImportBanners]);

  useEffect(() => {
    if (didAutoConnect.current) return;
    const connect = searchParams.get("connect");
    const showSmtp = searchParams.get("showSmtp");
    const showSes = searchParams.get("showSes");
    if (showSmtp === "true") {
      setAddModalStep("smtpMode");
      setAddModalOAuthProvider(null);
      setAddModalOpen(true);
      didAutoConnect.current = true;
      return;
    }
    if (showSes === "true") {
      setAddModalStep("ses");
      setAddModalOAuthProvider(null);
      setAddModalOpen(true);
      didAutoConnect.current = true;
      return;
    }
    if (connect === "gmail" || connect === "outlook" || connect === "zoho") {
      setAddModalStep("oauth");
      setAddModalOAuthProvider(connect);
      setAddModalOpen(true);
      didAutoConnect.current = true;
    }
  }, [searchParams]);

  const handleDelete = async (id: string, provider: string) => {
    if (provider === "ses") {
      toast.error("Remove SES senders from Domains page");
      return;
    }
    if (!confirm("Remove this sending account?")) return;
    try {
      await deleteSendingAccount(id);
      toast.success("Account removed");
      fetchAccounts();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to remove account";
      toast.error(msg);
    }
  };

  const handleTogglePause = async (account: SendingAccount) => {
    try {
      await updateSendingAccount(account.id, {
        status: account.status === "active" ? "paused" : "active",
      });
      fetchAccounts();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update account";
      toast.error(msg);
    }
  };

  const openAddModal = (step: AddSendingAccountModalStep = "pick") => {
    setAddModalStep(step);
    setAddModalOAuthProvider(null);
    setAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sending Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              {view === "health"
                ? "Is each inbox safe to send from? Fix anything flagged first."
                : "Connect inboxes, then review domain and account health separately."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${view === "accounts" ? "bg-slate-100 font-medium text-slate-900" : "text-slate-500"}`}
                onClick={() => setView("accounts")}
              >
                Accounts
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${view === "health" ? "bg-sky-50 font-medium text-sky-800" : "text-slate-500"}`}
                onClick={() => setView("health")}
              >
                Health
              </button>
            </div>
            <Button onClick={() => openAddModal()} className="shrink-0 rounded-lg">
              Add account
            </Button>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-5xl space-y-4 px-4 pb-10 sm:px-6 ${view === "health" ? "" : "py-4"}`}>
        {bulkImportJobIds.length > 0 && (
          <div className="space-y-3">
            {bulkImportJobIds.map((jobId) => (
              <SmtpBulkImportBanner
                key={jobId}
                jobId={jobId}
                onCompleted={fetchAccounts}
                onDismissed={(id) => {
                  setBulkImportJobIds((prev) => prev.filter((x) => x !== id));
                }}
              />
            ))}
          </div>
        )}

        {view === "health" ? (
          <SenderHealthPanel
            onViewInstructions={(senderId) => {
              const account = accounts.find((item) => item.id === senderId) || null;
              setDnsSetupAccount(account);
            }}
          />
        ) : (
        <SendingAccountsTable
          accounts={accounts}
          loading={loading}
          onAdd={() => openAddModal()}
          onTogglePause={handleTogglePause}
          onDelete={handleDelete}
          onDnsSetup={setDnsSetupAccount}
        />
        )}
      </main>

      <AddSendingAccountModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAccountAdded={fetchAccounts}
        onBulkImportStarted={(jobId) => {
          setBulkImportJobIds((prev) =>
            prev.includes(jobId) ? prev : [jobId, ...prev]
          );
        }}
        initialStep={addModalStep}
        initialOAuthProvider={addModalOAuthProvider}
      />

      <DomainAuthSetupDialog
        account={dnsSetupAccount}
        open={!!dnsSetupAccount}
        onOpenChange={(open) => {
          if (!open) setDnsSetupAccount(null);
        }}
        onRechecked={fetchAccounts}
      />
    </div>
  );
}
