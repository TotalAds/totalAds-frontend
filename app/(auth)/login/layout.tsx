import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("login");

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
