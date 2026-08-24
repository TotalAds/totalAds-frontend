"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconKey } from "@tabler/icons-react";

import { API_ENDPOINTS } from "@/components/developer/apiDocsContent";

const NAV = [
  { href: "/email/docs", label: "Overview" },
  { href: "/email/docs/reference", label: "Reference" },
  { href: "/email/docs/webhooks", label: "Webhooks" },
  { href: "/email/docs/examples", label: "Examples" },
];

export default function DocsLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-100 flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-brand-main/20 bg-bg-200/40 p-6 overflow-y-auto max-h-screen sticky top-0">
        <div className="text-xs uppercase tracking-widest text-text-400 font-semibold mb-4">
          Developer docs
        </div>
        <nav className="space-y-1 mb-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-brand-main/25 text-text-100 border border-brand-main/30"
                  : "text-text-400 hover:text-text-200 hover:bg-bg-300/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {pathname === "/email/docs/reference" && (
          <div className="space-y-4 border-t border-brand-main/15 pt-4">
            <p className="text-xs uppercase tracking-wide text-text-500">On this page</p>
            {API_ENDPOINTS.map((group) => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-text-300 mb-1">{group.group}</p>
                <ul className="space-y-0.5">
                  {group.items.map((ep) => (
                    <li key={ep.id}>
                      <a
                        href={`#${ep.id}`}
                        className="text-xs text-text-500 hover:text-brand-main block truncate py-0.5"
                      >
                        {ep.method} {ep.path}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/email/settings/api"
          className="mt-6 inline-flex items-center gap-2 text-sm text-brand-main font-medium hover:underline"
        >
          <IconKey className="w-4 h-4" />
          API keys
        </Link>
      </aside>
      <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-5xl">{children}</main>
    </div>
  );
}
