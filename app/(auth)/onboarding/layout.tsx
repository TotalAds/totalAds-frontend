import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("onboarding");

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
