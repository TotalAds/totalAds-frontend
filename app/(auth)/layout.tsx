import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leadsnipper - Website Scraper & Data Extraction",
  description:
    "Extract valuable information from any website with our powerful scraper",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-screen bg-bg">{children}</main>;
}
