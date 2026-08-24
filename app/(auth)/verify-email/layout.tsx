import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("verifyEmail");

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
