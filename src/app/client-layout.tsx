'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ToastContainer from '@/components/common/Toast';
import { useSidebarStore } from '@/lib/store';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebarStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
