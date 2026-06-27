"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import {
  AddSendingAccountModal,
  type AddSendingAccountModalStep,
} from "@/components/email/AddSendingAccountModal";
import { DomainAuthSetupDialog } from "@/components/email/DomainAuthSetupDialog";
import { SendingAccountsTable } from "@/components/email/SendingAccountsTable";
import { Button } from "@/components/ui/button";
import {
  deleteSendingAccount,
  listSendingAccounts,
  SendingAccount,
  updateSendingAccount,
} from "@/utils/api/emailClient";
import { IconPlus } from "@tabler/icons-react";

export default function SendingAccountsPage() {
  const searchParams = useSearchParams();
  const didAutoConnect = useRef(false);
  const [accounts, setAccounts] = useState<SendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalStep, setAddModalStep] = useState<AddSendingAccountModalStep>("pick");
  const [addModalOAuthProvider, setAddModalOAuthProvider] = useState<
    "gmail" | "outlook" | null
  >(null);
  const [dnsSetupAccount, setDnsSetupAccount] = useState<SendingAccount | null>(null);

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

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (didAutoConnect.current) return;
    const connect = searchParams.get("connect");
    const showSmtp = searchParams.get("showSmtp");
    const showSes = searchParams.get("showSes");
    if (showSmtp === "true") {
      setAddModalStep("smtp");
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
    if (connect === "gmail" || connect === "outlook") {
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sending Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Connect inboxes and set the sender name recipients see in their From
              field.
            </p>
          </div>
          <Button onClick={() => openAddModal()} className="shrink-0 gap-2">
            <IconPlus className="h-4 w-4" />
            Add account
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <SendingAccountsTable
          accounts={accounts}
          loading={loading}
          onAdd={() => openAddModal()}
          onTogglePause={handleTogglePause}
          onDelete={handleDelete}
          onDnsSetup={setDnsSetupAccount}
        />
      </main>

      <AddSendingAccountModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAccountAdded={fetchAccounts}
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
