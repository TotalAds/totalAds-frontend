import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("signup");

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
