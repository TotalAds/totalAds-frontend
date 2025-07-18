"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import SettingsSidebar from '@/components/navigation/SettingsSidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only render content if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect due to the useEffect above
  }

  return (
    <div className="flex min-h-screen">
      <SettingsSidebar />
      <div className="flex-1 p-8 bg-bg-50">
        {children}
      </div>
    </div>
  );
}
