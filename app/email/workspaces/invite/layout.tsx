import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("workspaceInvite");

export default function WorkspaceInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
