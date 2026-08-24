import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("unsubscribe");

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
