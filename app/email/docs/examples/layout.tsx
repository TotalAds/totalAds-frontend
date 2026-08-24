import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("docsExamples");

export default function DocsExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
