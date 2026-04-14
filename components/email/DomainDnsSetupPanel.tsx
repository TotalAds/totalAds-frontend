"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconBook, IconExternalLink, IconKeyboard } from "@tabler/icons-react";

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

/**
 * Static help for adding DNS at the user's registrar — no third-party API tokens.
 */
export function DomainDnsSetupPanel() {
  return (
    <div className="space-y-6 mb-8">
      <div className="rounded-2xl border border-primary-100/20 bg-gradient-to-br from-primary-100/10 to-bg-100/80 p-6">
        <h2 className="text-lg font-semibold text-text-100 mb-2">
          Add DNS at your provider
        </h2>
        <p className="text-sm text-text-200/95 leading-relaxed max-w-3xl">
          To send email, your domain needs{" "}
          <span className="text-text-100 font-medium">DKIM</span>,{" "}
          <span className="text-text-100 font-medium">SPF</span>, and{" "}
          <span className="text-text-100 font-medium">DMARC</span> records. Copy
          each value from the records below into your DNS host&apos;s management
          console.
        </p>
      </div>

      <Card className="border-bg-300/60 bg-bg-200/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-text-100">
            <IconBook className="w-5 h-5 text-amber-400/90" />
            Registrar &amp; DNS guides
          </CardTitle>
          <CardDescription className="text-text-200/90 flex items-start gap-2">
            <IconKeyboard className="w-4 h-4 text-primary-200 shrink-0 mt-0.5" />
            If your provider isn&apos;t listed, search their help for
            &quot;add TXT record&quot; or &quot;add CNAME record&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-300/90 uppercase tracking-wide font-medium">
            Popular hosts
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
        </CardContent>
      </Card>
    </div>
  );
}
