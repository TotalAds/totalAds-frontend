import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("forgotPassword");

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
