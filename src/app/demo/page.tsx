'use client';

import React, { Suspense } from 'react';
import AdminDashboardContent from '@/components/AdminDashboard';

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-space flex items-center justify-center text-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading demo dashboard...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent isDemoMode={true} />
    </Suspense>
  );
}
