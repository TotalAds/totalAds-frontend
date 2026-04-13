"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  applyCloudflareDns,
  getEmailServiceErrorMessage,
} from "@/utils/api/emailClient";
import {
  IconBook,
  IconCloudComputing,
  IconKeyboard,
  IconLock,
  IconExternalLink,
} from "@tabler/icons-react";

type PathChoice = "pick" | "cloudflare" | "manual";

const REGISTRAR_GUIDES: { label: string; href: string }[] = [
  {
    label: "Cloudflare",
    href: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
  },
  {
    label: "GoDaddy",
    href: "https://www.godaddy.com/help/add-a-cname-record-19236",
  },
  {
    label: "Namecheap",
    href: "https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/",
  },
  {
    label: "Squarespace",
    href: "https://support.squarespace.com/hc/en-us/articles/360002101888-Connecting-a-domain-to-your-site",
  },
  {
    label: "Google Workspace",
    href: "https://support.google.com/a/answer/47283",
  },
  {
    label: "Microsoft 365",
    href: "https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider",
  },
  {
    label: "AWS Route 53",
    href: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html",
  },
];

const CF_TOKEN_HELP =
  "https://developers.cloudflare.com/fundamentals/api/get-started/create-token/";

interface DomainDnsSetupPanelProps {
  domainId: string;
  domainLabel: string;
  useMergedSpf: boolean;
  onAfterAutomatedApply: () => void | Promise<void>;
}

export function DomainDnsSetupPanel({
  domainId,
  domainLabel,
  useMergedSpf,
  onAfterAutomatedApply,
}: DomainDnsSetupPanelProps) {
  const [path, setPath] = useState<PathChoice>("pick");
  const [apiToken, setApiToken] = useState("");
  const [applying, setApplying] = useState(false);

  const handleCloudflareApply = async () => {
    if (!apiToken.trim()) {
      toast.error("Paste your Cloudflare API token first.");
      return;
    }
    setApplying(true);
    try {
      const result = await applyCloudflareDns(
        domainId,
        apiToken.trim(),
        useMergedSpf ? "merge" : "new"
      );
      toast.success(result.message);
      setApiToken("");
      await onAfterAutomatedApply();
    } catch (e) {
      toast.error(getEmailServiceErrorMessage(e, "Could not apply DNS via Cloudflare"));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="rounded-2xl border border-primary-100/20 bg-gradient-to-br from-primary-100/10 to-bg-100/80 p-6">
        <h2 className="text-lg font-semibold text-text-100 mb-2">
          Connect your domain the easy way
        </h2>
        <p className="text-sm text-text-200/95 leading-relaxed max-w-3xl">
          To send email through our email service, your domain needs three kinds of DNS
          records—usually called{" "}
          <span className="text-text-100 font-medium">DKIM</span> (prove you
          own the domain),{" "}
          <span className="text-text-100 font-medium">SPF</span> (authorize our
          mail servers), and{" "}
          <span className="text-text-100 font-medium">DMARC</span> (tell Gmail
          and others how to handle spoofing). Choose how you want to add them—you
          can always switch.
        </p>
      </div>

      {path === "pick" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-primary-100/25 bg-bg-200/40 hover:border-primary-100/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-100">
                <IconCloudComputing className="w-5 h-5 text-sky-400" />
                Cloudflare — apply for me
              </CardTitle>
              <CardDescription className="text-text-200/90 text-sm">
                If this domain uses Cloudflare DNS, paste a short-lived API
                token and we&apos;ll create or update the records in one step.
                Your token is not saved on our servers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full text-white"
                onClick={() => setPath("cloudflare")}
              >
                Use Cloudflare
              </Button>
            </CardContent>
          </Card>

          <Card className="border-bg-300/60 bg-bg-200/40 hover:border-primary-100/25 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-text-100">
                <IconKeyboard className="w-5 h-5 text-primary-200" />
                I&apos;ll add records myself
              </CardTitle>
              <CardDescription className="text-text-200/90 text-sm">
                Best if you use another registrar or don&apos;t want to share
                API access. We&apos;ll show you each value to copy below—no
                account connection required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full text-text-100"
                onClick={() => setPath("manual")}
              >
                Show me the records
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {path === "cloudflare" && (
        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardHeader>
            <CardTitle className="text-base text-text-100">
              Cloudflare API token
            </CardTitle>
            <CardDescription className="text-text-200/90 space-y-2">
              <p>
                In Cloudflare, create an API token with permission{" "}
                <strong className="text-text-100">Zone → DNS → Edit</strong> for
                zone <span className="font-mono text-xs">{domainLabel}</span>.
              </p>
              <a
                href={CF_TOKEN_HELP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm"
              >
                How to create a token
                <IconExternalLink className="w-3.5 h-3.5" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-bg-200/50 border border-bg-300/50 p-3 text-xs text-text-200/95">
              <IconLock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              The token is sent only to apply DNS once and is not stored. For
              your security, create a token limited to this zone only.
            </div>
            <input
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste API token"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-100/80 border border-bg-300/60 text-text-100 text-sm placeholder:text-text-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCloudflareApply}
                disabled={applying}
                className="text-white"
              >
                {applying ? "Applying…" : "Apply DNS records"}
              </Button>
              <Button variant="ghost" onClick={() => setPath("pick")}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {path === "manual" && (
        <Card className="border-bg-300/60 bg-bg-200/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-text-100">
              <IconBook className="w-5 h-5 text-amber-400/90" />
              Manual setup
            </CardTitle>
            <CardDescription className="text-text-200/90">
              Use the steps below to paste each record into your DNS host. If
              your provider isn&apos;t listed, open their help center and search
              for &quot;add TXT record&quot; or &quot;add CNAME record&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-text-300/90 uppercase tracking-wide font-medium">
              Popular DNS & registrar guides
            </p>
            <div className="flex flex-wrap gap-2">
              {REGISTRAR_GUIDES.map((g) => (
                <a
                  key={g.href}
                  href={g.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-bg-300/60 bg-bg-100/40 px-3 py-1.5 text-xs text-primary-200 hover:bg-bg-200/60 transition-colors"
                >
                  {g.label}
                  <IconExternalLink className="w-3 h-3 opacity-70" />
                </a>
              ))}
            </div>
            <Button variant="outline" className="mt-1" onClick={() => setPath("pick")}>
              ← Other connection options
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
