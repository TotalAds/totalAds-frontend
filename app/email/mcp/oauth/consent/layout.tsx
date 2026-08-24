import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("oauthConsent");

export default function OAuthConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
