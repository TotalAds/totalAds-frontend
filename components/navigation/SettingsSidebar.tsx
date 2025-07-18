"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { IconKey, IconBrandStripe, IconUser, IconBell, IconLock } from '@tabler/icons-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const SettingsSidebar = () => {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    {
      name: 'Account',
      href: '/settings/account',
      icon: <IconUser className="w-5 h-5" />
    },
    {
      name: 'API Tokens',
      href: '/settings/api-tokens',
      icon: <IconKey className="w-5 h-5" />
    },
    {
      name: 'Billing',
      href: '/settings/billing',
      icon: <IconBrandStripe className="w-5 h-5" />
    },
    {
      name: 'Notifications',
      href: '/settings/notifications',
      icon: <IconBell className="w-5 h-5" />
    },
    {
      name: 'Security',
      href: '/settings/security',
      icon: <IconLock className="w-5 h-5" />
    }
  ];

  return (
    <div className="w-64 bg-bg-50 border-r border-bg-200 h-full py-6">
      <h2 className="px-6 text-lg font-semibold mb-6">Settings</h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium",
                isActive
                  ? "bg-primary-50 text-primary-700 border-r-2 border-primary-700"
                  : "text-text-300 hover:bg-bg-100 hover:text-text"
              )}
            >
              <span className={cn("mr-3", isActive ? "text-primary-700" : "text-text-300")}>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SettingsSidebar;
