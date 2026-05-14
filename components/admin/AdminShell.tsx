'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Users,
  CalendarClock,
  Mail,
  ScanLine,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tiers', label: 'Entradas', icon: Ticket },
  { href: '/admin/orders', label: 'Ventas', icon: Ticket, soon: true },
  { href: '/admin/users', label: 'Usuarios', icon: Users, soon: true },
  { href: '/admin/meetings', label: 'Citas', icon: CalendarClock, soon: true },
  { href: '/admin/emails', label: 'Correos', icon: Mail, soon: true },
  { href: '/admin/gate', label: 'Portería', icon: ScanLine, soon: true },
  { href: '/admin/settings', label: 'Ajustes', icon: Settings, soon: true }
];

export default function AdminShell({
  children,
  email,
  fullName
}: {
  children: React.ReactNode;
  email: string;
  fullName: string;
}) {
  const pathname = usePathname() ?? '/admin';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  }

  return (
    <div className="flex min-h-screen bg-linku-bg">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-linku-border bg-linku-bg-2 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-linku-border px-5">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/brand/linku-icon.png" alt="LinkU" width={72} height={72} className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tightish text-linku-text">
                LINKU <span className="text-linku-coral">ADMIN</span>
              </span>
              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.22em] text-linku-coral/70">
                Backoffice
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-linku-border-2 p-1.5 text-linku-text lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.soon ? '#' : item.href}
                    onClick={(e) => {
                      if (item.soon) e.preventDefault();
                      else setOpen(false);
                    }}
                    aria-current={active ? 'page' : undefined}
                    aria-disabled={item.soon || undefined}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'bg-linku-coral/15 text-linku-coral'
                        : item.soon
                        ? 'text-linku-text-dim cursor-not-allowed'
                        : 'text-linku-text-muted hover:bg-white/5 hover:text-linku-text'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} strokeWidth={1.75} />
                      {item.label}
                    </span>
                    {item.soon && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-linku-text-dim">
                        Pronto
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-linku-border p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linku-coral/15 text-sm font-bold text-linku-coral">
              {(fullName || email).slice(0, 1).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-linku-text">
                {fullName || email.split('@')[0]}
              </span>
              <span className="truncate text-xs text-linku-text-muted">{email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-linku-border-2 px-3 py-2 text-xs font-semibold text-linku-text-muted transition hover:border-white/25 hover:bg-white/5 hover:text-linku-text disabled:opacity-50"
          >
            <LogOut size={14} />
            {signingOut ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-linku-border bg-linku-bg/80 px-5 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-linku-border-2 p-2 text-linku-text"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold tracking-tightish text-linku-text">
            LINKU <span className="text-linku-coral">ADMIN</span>
          </span>
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
