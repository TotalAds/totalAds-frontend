"use client";

import {
  API_ENDPOINTS,
  ERROR_CODES,
  RESPONSE_ENVELOPE_EXAMPLE,
  RESPONSE_ENVELOPE_FIELDS,
  buildCurl,
  getEndpointSampleBody,
  type ApiEndpoint,
} from "@/components/developer/apiDocsContent";
import {
  CodeBlock,
  MethodBadge,
  SchemaTable,
} from "@/components/developer/ApiDocComponents";

export default function DocsReferencePage() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-text-100">API reference</h1>
        <p className="text-text-300 leading-relaxed max-w-3xl">
          Every endpoint returns a consistent JSON envelope. Authenticate with{" "}
          <code className="text-brand-main bg-brand-main/10 px-1.5 py-0.5 rounded">
            Authorization: Bearer ls_live_...
          </code>
          . Required scopes are listed per endpoint.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-brand-main/20 bg-bg-200/80 p-6">
        <h2 className="text-lg font-semibold text-text-100">Response envelope</h2>
        <p className="text-sm text-text-400">
          All successful and error responses share this top-level shape. Endpoint-specific data lives in{" "}
          <code className="text-text-200">data</code>.
        </p>
        <CodeBlock
          title="Example response"
          code={JSON.stringify(RESPONSE_ENVELOPE_EXAMPLE, null, 2)}
        />
        <SchemaTable fields={RESPONSE_ENVELOPE_FIELDS} title="Envelope fields" />
      </section>

      {API_ENDPOINTS.map((group) => (
        <section key={group.group} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-text-100">{group.group}</h2>
            <p className="text-sm text-text-400 mt-1">{group.description}</p>
          </div>
          <div className="space-y-4">
            {group.items.map((endpoint) => (
              <EndpointCard key={endpoint.id} endpoint={endpoint} />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-text-100">Error codes</h2>
        <div className="rounded-xl border border-brand-main/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-300/80 text-text-300 text-left">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">HTTP</th>
                <th className="px-4 py-3">When it happens</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((row) => (
                <tr key={row.code} className="border-t border-brand-main/10">
                  <td className="px-4 py-3 font-mono text-brand-main text-xs">{row.code}</td>
                  <td className="px-4 py-3 text-text-400">{row.status}</td>
                  <td className="px-4 py-3 text-text-300">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const sampleBody = getEndpointSampleBody(endpoint);
  const curl = buildCurl(endpoint.method, endpoint.path, sampleBody);

  return (
    <article
      id={endpoint.id}
      className="rounded-2xl border border-brand-main/20 bg-bg-200/60 overflow-hidden scroll-mt-6"
    >
      <div className="px-5 py-4 border-b border-brand-main/15 bg-bg-300/40 flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm text-text-100 font-mono">{endpoint.path}</code>
        <span className="text-xs px-2 py-0.5 rounded-full border border-brand-main/30 text-text-400">
          scope: {endpoint.scope}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-text-100">{endpoint.title}</h3>
          <p className="text-sm text-text-400 mt-1 leading-relaxed">{endpoint.description}</p>
        </div>

        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <SchemaTable fields={endpoint.queryParams} title="Query parameters" />
        )}

        {endpoint.requestBody && (
          <div className="space-y-3">
            <SchemaTable fields={endpoint.requestBody.fields} title="Request body" />
            {endpoint.requestBody.description && (
              <p className="text-xs text-text-500">{endpoint.requestBody.description}</p>
            )}
            <CodeBlock
              title="Request example"
              code={JSON.stringify(endpoint.requestBody.example, null, 2)}
            />
          </div>
        )}

        {endpoint.responseData && (
          <div className="space-y-3">
            <SchemaTable fields={endpoint.responseData.fields} title="Response data (inside envelope.data)" />
            {endpoint.responseData.description && (
              <p className="text-xs text-text-500">{endpoint.responseData.description}</p>
            )}
            <CodeBlock
              title="Response example"
              code={JSON.stringify(
                { success: true, data: endpoint.responseData.example, meta: { requestId: "ls_...", apiVersion: "2026-08-23" } },
                null,
                2
              )}
            />
          </div>
        )}

        {endpoint.statusCodes && endpoint.statusCodes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-100">Status codes</h4>
            <ul className="text-sm text-text-400 space-y-1">
              {endpoint.statusCodes.map((s) => (
                <li key={s.code}>
                  <span className="font-mono text-text-200">{s.code}</span> — {s.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {endpoint.notes && endpoint.notes.length > 0 && (
          <ul className="text-xs text-text-500 list-disc list-inside space-y-1">
            {endpoint.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        <CodeBlock title="cURL" code={curl} />
      </div>
    </article>
  );
}
