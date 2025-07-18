import type { Metadata } from "next";
import "../globals.css";

import { Nunito_Sans } from "next/font/google";

import { cn } from "@/utils/cn";

import Provider from "../provider";

const inter = Nunito_Sans({ subsets: ["latin"] });

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, ["bg-bg"])}>
        <Provider>
          <main className="min-h-screen">{children}</main>
        </Provider>
      </body>
    </html>
  );
}
