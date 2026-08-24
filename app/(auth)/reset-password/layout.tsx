import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("resetPassword");

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
