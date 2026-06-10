'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import WhatsAppButton from './WhatsAppButton';

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <WhatsAppButton />
    </div>
  );
}
