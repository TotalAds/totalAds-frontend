import DocsLayoutShell from "@/components/developer/DocsLayoutShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("docs");

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayoutShell>{children}</DocsLayoutShell>;
}
