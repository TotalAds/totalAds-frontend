import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("docsWebhooks");

export default function DocsWebhooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
