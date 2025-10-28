import { Metadata } from 'next';
import React from 'react';

import LeadEnhancementHistory from '@/components/lead-enhancement/LeadEnhancementHistory';

export const metadata: Metadata = {
  title: "Lead Enhancement History | Leadsnipper",
  description: "View your past lead enhancement jobs and results",
};

export default function LeadEnhancementHistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto py-8 px-4">
        <LeadEnhancementHistory />
      </div>
    </div>
  );
}
