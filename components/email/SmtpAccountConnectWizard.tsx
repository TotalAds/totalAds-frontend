"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmtpImapRequiredCallout } from "@/components/email/SendingProviderCapabilitiesTable";
import {
  formatSenderFromPreview,
  isValidSenderDisplayName,
  normalizeSenderDisplayName,
} from "@/lib/senderDisplayName";
import {
  createSmtpSendingAccount,
  testImapCredentials,
  testSmtpCredentials,
  testSmtpOnlyCredentials,
  testSmtpSendingAccount,
} from "@/utils/api/emailClient";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconMail,
  IconSend,
} from "@tabler/icons-react";

type WizardStep = "identity" | "imap" | "smtp";

export type SmtpWizardForm = {
  firstName: string;
  lastName: string;
  email: string;
  mailUsername: string;
  mailPassword: string;
  useCustomImapAuth: boolean;
  imapUsername: string;
  imapPassword: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  useCustomSmtpAuth: boolean;
  smtpUsername: string;
  smtpPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
};

const INITIAL_FORM: SmtpWizardForm = {
  firstName: "",
  lastName: "",
  email: "",
  mailUsername: "",
  mailPassword: "",
  useCustomImapAuth: false,
  imapUsername: "",
  imapPassword: "",
  imapHost: "",
  imapPort: 993,
  imapSecure: true,
  useCustomSmtpAuth: false,
  smtpUsername: "",
  smtpPassword: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
};

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

function suggestSmtpHost(imapHost: string): string {
  const host = imapHost.trim();
  if (!host) return "";
  if (host.startsWith("imap.")) return `smtp.${host.slice(5)}`;
  return host.replace(/imap/i, "smtp");
}

function resolveImapAuth(form: SmtpWizardForm) {
  return {
    imapUsername: form.useCustomImapAuth
      ? form.imapUsername.trim()
      : form.mailUsername.trim(),
    imapPassword: form.useCustomImapAuth
      ? form.imapPassword
      : form.mailPassword,
  };
}

function resolveSmtpAuth(form: SmtpWizardForm) {
  return {
    smtpUsername: form.useCustomSmtpAuth
      ? form.smtpUsername.trim()
      : form.mailUsername.trim(),
    smtpPassword: form.useCustomSmtpAuth
      ? form.smtpPassword
      : form.mailPassword,
  };
}

function buildPayload(form: SmtpWizardForm, displayName: string) {
  const imapAuth = resolveImapAuth(form);
  const smtpAuth = resolveSmtpAuth(form);

  return {
    email: form.email.trim(),
    displayName,
    mailUsername: form.mailUsername.trim(),
    mailPassword: form.mailPassword,
    imapHost: form.imapHost.trim(),
    imapPort: form.imapPort,
    imapSecure: form.imapSecure,
    ...imapAuth,
    smtpHost: form.smtpHost.trim(),
    smtpPort: form.smtpPort,
    smtpSecure: form.smtpSecure,
    ...smtpAuth,
  };
}

type SmtpAccountConnectWizardProps = {
  onBack: () => void;
  onComplete: () => void;
};

export function SmtpAccountConnectWizard({
  onBack,
  onComplete,
}: SmtpAccountConnectWizardProps) {
  const [step, setStep] = useState<WizardStep>("identity");
  const [form, setForm] = useState<SmtpWizardForm>(INITIAL_FORM);
  const [stepError, setStepError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imapVerified, setImapVerified] = useState(false);

  const displayName = [form.firstName, form.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  const goIdentity = () => {
    setStepError(null);
    setStep("identity");
  };

  const handleIdentityNext = () => {
    setStepError(null);
    if (!form.email.trim()) {
      setStepError("Email address is required.");
      return;
    }
    if (!form.mailUsername.trim()) {
      setStepError("Mail username is required.");
      return;
    }
    if (!form.mailPassword) {
      setStepError("Mail password is required.");
      return;
    }
    const normalized = normalizeSenderDisplayName(displayName);
    if (!isValidSenderDisplayName(normalized)) {
      setStepError(
        "Enter a first or last name so recipients see who the email is from."
      );
      return;
    }
    setForm((f) => ({
      ...f,
      mailUsername: f.mailUsername.trim() || f.email.trim(),
    }));
    setStep("imap");
  };

  const handleImapNext = async () => {
    setStepError(null);
    const imapAuth = resolveImapAuth(form);
    if (!form.imapHost.trim() || !imapAuth.imapUsername || !imapAuth.imapPassword) {
      setStepError("IMAP host and mail login are required.");
      return;
    }

    try {
      setLoading(true);
      await testImapCredentials({
        email: form.email.trim(),
        imapHost: form.imapHost.trim(),
        imapPort: form.imapPort,
        imapSecure: form.imapSecure,
        mailUsername: form.mailUsername.trim(),
        mailPassword: form.mailPassword,
        ...imapAuth,
      });
      setImapVerified(true);
      setForm((f) => ({
        ...f,
        smtpHost: f.smtpHost.trim() || suggestSmtpHost(f.imapHost),
      }));
      setStep("smtp");
    } catch (error: unknown) {
      setStepError(
        error instanceof Error ? error.message : "IMAP connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setStepError(null);
    const smtpAuth = resolveSmtpAuth(form);
    if (!form.smtpHost.trim() || !smtpAuth.smtpUsername || !smtpAuth.smtpPassword) {
      setStepError("SMTP host and mail login are required.");
      return;
    }

    const normalizedName = normalizeSenderDisplayName(displayName);
    const payload = buildPayload(form, normalizedName);

    try {
      setLoading(true);
      await testSmtpOnlyCredentials({
        email: payload.email,
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        smtpSecure: payload.smtpSecure,
        mailUsername: payload.mailUsername,
        mailPassword: payload.mailPassword,
        smtpUsername: payload.smtpUsername,
        smtpPassword: payload.smtpPassword,
      });
      await testSmtpCredentials(payload);
      const account = await createSmtpSendingAccount(payload);
      await testSmtpSendingAccount(account.id);
      toast.success("IMAP and SMTP verified — account connected");
      onComplete();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to connect account";
      setStepError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 px-6 py-6">
      <button
        type="button"
        onClick={
          step === "identity"
            ? onBack
            : step === "imap"
              ? goIdentity
              : () => {
                  setStepError(null);
                  setStep("imap");
                }
        }
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <IconChevronLeft className="h-4 w-4" />
        {step === "identity" ? "Select another provider" : "Back"}
      </button>

      {step === "identity" && (
        <>
          <StepHeader
            icon={<IconMail className="h-5 w-5" />}
            title="Connect any provider account"
            subtitle="IMAP / SMTP"
          />
          <FieldError message={stepError} />
          <SmtpImapRequiredCallout />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                First name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="First name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                Last name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                  mailUsername:
                    form.mailUsername || e.target.value.trim(),
                })
              }
              placeholder="Email address to connect"
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
            <p className="text-sm text-slate-600">
              You will connect <strong>SMTP</strong> (outgoing) and <strong>IMAP</strong>{" "}
              (incoming) in the next steps. Most providers use the same login for both — enter
              it once here; you can override per server if needed.
            </p>
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                Mail username <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.mailUsername}
                onChange={(e) =>
                  setForm({ ...form, mailUsername: e.target.value })
                }
                placeholder="Usually your full email address"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                Mail password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={form.mailPassword}
                onChange={(e) =>
                  setForm({ ...form, mailPassword: e.target.value })
                }
                placeholder="Password or app password"
              />
            </div>
          </div>
          {isValidSenderDisplayName(displayName) && form.email && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Recipients will see
              </p>
              <p className="font-mono text-slate-800">
                {formatSenderFromPreview(form.email, displayName)}
              </p>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={handleIdentityNext} className="gap-1">
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {step === "imap" && (
        <>
          <StepHeader
            icon={<IconDownload className="h-5 w-5" />}
            title="IMAP"
            subtitle="Incoming mail — required for replies & bounces"
          />
          <FieldError message={stepError} />
          <SmtpImapRequiredCallout />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                IMAP host <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.imapHost}
                onChange={(e) =>
                  setForm({ ...form, imapHost: e.target.value })
                }
                placeholder="imap.your-provider.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                IMAP port <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={form.imapPort}
                onChange={(e) => {
                  const imapPort = parseInt(e.target.value, 10) || 993;
                  setForm({
                    ...form,
                    imapPort,
                    imapSecure: imapPort === 993,
                  });
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.imapSecure}
                onChange={(e) =>
                  setForm({ ...form, imapSecure: e.target.checked })
                }
              />
              Use SSL/TLS for IMAP (typical for port 993)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.useCustomImapAuth}
                onChange={(e) =>
                  setForm({ ...form, useCustomImapAuth: e.target.checked })
                }
              />
              Use different username/password for IMAP
            </label>
            {form.useCustomImapAuth && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700">IMAP username</Label>
                  <Input
                    value={form.imapUsername}
                    onChange={(e) =>
                      setForm({ ...form, imapUsername: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">IMAP password</Label>
                  <Input
                    type="password"
                    value={form.imapPassword}
                    onChange={(e) =>
                      setForm({ ...form, imapPassword: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goIdentity} className="gap-1">
              <IconChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => void handleImapNext()}
              disabled={loading}
              className="gap-1"
            >
              {loading ? "Testing IMAP…" : "Next"}
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {step === "smtp" && (
        <>
          <StepHeader
            icon={<IconSend className="h-5 w-5" />}
            title="SMTP"
            subtitle="Outgoing mail server"
          />
          {imapVerified && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              IMAP connection verified. Add your SMTP server details to finish.
            </div>
          )}
          <FieldError message={stepError} />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                SMTP host <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.smtpHost}
                onChange={(e) =>
                  setForm({ ...form, smtpHost: e.target.value })
                }
                placeholder="smtp.your-provider.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">
                SMTP port <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={form.smtpPort}
                onChange={(e) => {
                  const smtpPort = parseInt(e.target.value, 10) || 587;
                  setForm({
                    ...form,
                    smtpPort,
                    smtpSecure: smtpPort === 465,
                  });
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.smtpSecure}
                onChange={(e) =>
                  setForm({ ...form, smtpSecure: e.target.checked })
                }
              />
              Use SSL/TLS for SMTP (typical for port 465)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.useCustomSmtpAuth}
                onChange={(e) =>
                  setForm({ ...form, useCustomSmtpAuth: e.target.checked })
                }
              />
              Use different username/password for SMTP
            </label>
            {form.useCustomSmtpAuth && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700">SMTP username</Label>
                  <Input
                    value={form.smtpUsername}
                    onChange={(e) =>
                      setForm({ ...form, smtpUsername: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">SMTP password</Label>
                  <Input
                    type="password"
                    value={form.smtpPassword}
                    onChange={(e) =>
                      setForm({ ...form, smtpPassword: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setStepError(null);
                setStep("imap");
              }}
              className="gap-1"
            >
              <IconChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => void handleConnect()}
              disabled={loading}
              className="gap-1"
            >
              {loading ? "Connecting…" : "Connect account"}
              <IconArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
