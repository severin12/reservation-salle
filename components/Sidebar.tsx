'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: 'dashboard' },
  { href: '/rooms', label: 'Salles', icon: 'rooms' },
  { href: '/reservations', label: 'Réservations', icon: 'calendar' },
  { href: '/reservations/new', label: 'Nouvelle', icon: 'plus' },
  { href: '/admin', label: 'Admin', icon: 'admin', adminOnly: true },
];

function NavIcon({ name }: { name: string }) {
  const className = 'h-5 w-5 shrink-0';
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    case 'rooms':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
        </svg>
      );
    case 'admin':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === 'Admin');

  const linkClass = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      active ? 'bg-white/15 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;
  };

  return (
    <>
      <aside className="no-print hidden w-72 shrink-0 flex-col bg-[#1e3a5f] text-white shadow-xl lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Réservation</p>
            <h2 className="mt-2 text-xl font-bold">Gestion des Salles</h2>
            {user && (
              <p className="mt-2 text-sm text-white/70">
                {user.name} · <span className="text-sky-200">{user.role}</span>
              </p>
            )}
          </div>

          <nav className="flex-1 space-y-1">
            {visibleItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex items-center gap-3 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#16304f] bg-[#1e3a5f] px-2 py-2 shadow-2xl lg:hidden">
        {visibleItems.slice(0, 5).map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                active ? 'text-white' : 'text-white/60'
              }`}
            >
              <NavIcon name={item.icon} />
              <span className="truncate">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
