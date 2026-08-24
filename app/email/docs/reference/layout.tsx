import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("docsReference");

export default function DocsReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
