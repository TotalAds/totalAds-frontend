"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/email/docs", label: "Overview" },
  { href: "/email/docs/reference", label: "Reference" },
  { href: "/email/docs/webhooks", label: "Webhooks" },
  { href: "/email/docs/examples", label: "Examples" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-100 flex">
      <aside className="hidden md:block w-56 shrink-0 border-r border-brand-main/15 p-6">
        <div className="text-xs uppercase tracking-wide text-text-400 mb-4">Developer docs</div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                pathname === item.href
                  ? "bg-brand-main/20 text-text-100"
                  : "text-text-400 hover:text-text-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/email/settings/api"
          className="mt-6 block text-sm text-brand-main underline"
        >
          API keys
        </Link>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-4xl">{children}</main>
    </div>
  );
}
