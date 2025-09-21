/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import "./globals.css";

import { Nunito_Sans } from "next/font/google";

import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { cn } from "@/utils/cn";

import Provider from "./provider";

// Import tour utils for testing (only in development)
if (process.env.NODE_ENV === "development") {
  import("@/utils/tourUtils");
}

const inter = Nunito_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leadsnipper - Website Scraper & Data Extraction",
  description:
    "Extract valuable information from any website with our powerful scraper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(inter.className, [
          "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
        ])}
      >
        <Provider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Provider>
        {/* subtle footer link */}
        <div className="fixed bottom-2 right-3 text-[10px] text-slate-400/60 hover:text-slate-300/80">
          <a href="/legal/data-use">Data use</a>
        </div>
      </body>
    </html>
  );
}
