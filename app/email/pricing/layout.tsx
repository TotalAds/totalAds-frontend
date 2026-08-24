import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("pricing");

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
