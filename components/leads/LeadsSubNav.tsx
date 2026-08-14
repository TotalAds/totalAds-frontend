"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "All leads", href: "/email/leads" },
  { label: "Archived", href: "/email/leads/archived" },
];

export default function LeadsSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-3 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const active =
          tab.href === "/email/leads"
            ? pathname === "/email/leads"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-main text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
