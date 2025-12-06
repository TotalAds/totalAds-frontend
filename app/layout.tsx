/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import "./globals.css";

import { Inter } from "next/font/google";
import { Suspense } from "react";

import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { cn } from "@/utils/cn";

import Provider from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leadsnipper - Email Marketing & Cold Outreach Platform",
  description:
    "Convert cold email into predictable revenue with deliverability-first email marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={cn(inter.className, ["bg-bg-100 text-text-100 antialiased"])}
      >
        <Suspense fallback={null}>
          <Provider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </Provider>
        </Suspense>
        {/* subtle footer link */}
      </body>
    </html>
  );
}
