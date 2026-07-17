"use client";

import { cn } from "@/lib/utils";

/**
 * Renders full email HTML (often includes &lt;body style="padding…"&gt;) inside a
 * sandboxed iframe so document-level body styles do not leak into the app layout.
 */
export default function IsolatedEmailHtmlPreview({
  html,
  title = "Email preview",
  className,
  iframeClassName,
}: {
  html: string;
  title?: string;
  className?: string;
  iframeClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-white", className)}>
      <iframe
        title={title}
        sandbox="allow-same-origin"
        srcDoc={html || "<p></p>"}
        className={cn(
          "block w-full border-0 bg-white [scrollbar-width:thin]",
          iframeClassName
        )}
      />
    </div>
  );
}
