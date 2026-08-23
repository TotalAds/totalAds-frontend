"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { IconCopy } from "@tabler/icons-react";

import { API_ENDPOINTS, ERROR_CODES, buildCurl } from "@/components/developer/apiDocsContent";
import { Button } from "@/components/ui/button";

export default function DocsReferencePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-text-100">API reference</h1>
        <p className="text-text-400 text-sm mt-1">
          All requests require <code>Authorization: Bearer ls_live_...</code>. Responses use a standard envelope with{" "}
          <code>success</code>, <code>data</code>, and <code>meta</code>.
        </p>
      </div>

      {API_ENDPOINTS.map((group) => (
        <section key={group.group} className="space-y-3">
          <h2 className="text-lg font-semibold text-text-100">{group.group}</h2>
          <div className="rounded-xl border border-brand-main/15 divide-y divide-brand-main/10">
            {group.items.map((item) => (
              <EndpointRow key={`${item.method}-${item.path}`} {...item} />
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-lg font-semibold text-text-100 mb-3">Error codes</h2>
        <div className="rounded-xl border border-brand-main/15 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-200/80 text-text-300 text-left">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">HTTP</th>
                <th className="px-4 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((row) => (
                <tr key={row.code} className="border-t border-brand-main/10">
                  <td className="px-4 py-2 font-mono text-text-200">{row.code}</td>
                  <td className="px-4 py-2 text-text-400">{row.status}</td>
                  <td className="px-4 py-2 text-text-300">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  scope,
  description,
}: {
  method: string;
  path: string;
  scope: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const sampleBody =
    method === "POST" && path === "/emails/send"
      ? {
          from: { senderId: "123" },
          to: { email: "user@example.com" },
          subject: "Hello",
          html: "<p>Hi</p>",
        }
      : method === "POST" && path === "/campaigns/send"
        ? {
            name: "API Campaign",
            domainId: "0",
            senderConfig: { senderIds: ["123"] },
            sequence: [{ subject: "Hi", body: "<p>Hello</p>", delayMinutes: 0 }],
            recipients: [{ email: "user@example.com", name: "User" }],
          }
        : undefined;

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-main/20 text-brand-main">
          {method}
        </span>
        <code className="text-sm text-text-100">{path}</code>
        <span className="text-xs text-text-500">scope: {scope}</span>
      </button>
      <p className="text-sm text-text-400 mt-1">{description}</p>
      {open && (
        <div className="mt-3 relative">
          <pre className="rounded-lg bg-bg-300/80 p-3 text-xs text-text-200 overflow-x-auto">
            {buildCurl(method, path, sampleBody)}
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 border-brand-main/30"
            onClick={async () => {
              await navigator.clipboard.writeText(buildCurl(method, path, sampleBody));
              toast.success("cURL copied");
            }}
          >
            <IconCopy className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
