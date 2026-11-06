'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-space flex items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-prussian border-t-orange rounded-full animate-spin" />
    </div>
  );
}
