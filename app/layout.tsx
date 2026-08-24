/* eslint-disable @next/next/no-sync-scripts */
import "./globals.css";

import { Inter } from "next/font/google";
import { Suspense } from "react";

import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { buildDefaultMetadata } from "@/lib/seo";
import { cn } from "@/utils/cn";

import Provider from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = buildDefaultMetadata();

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
      </body>
    </html>
  );
}
