'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, UserCircle2 } from 'lucide-react';
import CoralButton from '@/components/ui/CoralButton';
import OutlineButton from '@/components/ui/OutlineButton';

const NAV_LINKS = [
  { href: '#agenda', label: 'Agenda' },
  { href: '#speakers', label: 'Speakers' },
  { href: '#tesis', label: 'Tracks' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#sponsors', label: 'Sponsors' },
  { href: '#faq', label: 'FAQ' }
];

type Props = {
  contacts: { sponsors: string; invites: string; partners: string };
  isLoggedIn?: boolean;
};

export default function Navbar({ contacts, isLoggedIn = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
        scrolled
          ? 'border-b border-linku-border bg-linku-bg/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link href="#" className="flex items-center gap-3" aria-label="LinkU Summit 2026">
          <Image
            src="/brand/linku-icon.png"
            alt="LinkU"
            width={80}
            height={80}
            priority
            className="h-9 w-9 sm:h-10 sm:w-10"
          />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tightish text-linku-text sm:text-base">
              LINKU <span className="text-linku-coral">SUMMIT</span>
            </span>
            <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.22em] text-linku-coral/70 sm:text-[9px]">
              By LinkU Ventures
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-linku-text-muted transition hover:text-linku-text"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <OutlineButton href="/me">
              <UserCircle2 size={16} /> Mi cuenta
            </OutlineButton>
          ) : (
            <OutlineButton href="/login">Iniciar sesión</OutlineButton>
          )}
          <CoralButton href="#tickets">Comprar entrada</CoralButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-linku-border-2 p-2 text-linku-text lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-linku-bg/95 backdrop-blur-2xl transition lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 sm:h-20 sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/linku-icon.png"
              alt="LinkU"
              width={64}
              height={64}
              className="h-8 w-8"
            />
            <span className="text-sm font-bold tracking-tightish text-linku-text">
              LINKU <span className="text-linku-coral">SUMMIT</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-linku-border-2 p-2 text-linku-text"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-5 pt-4 sm:px-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-linku-border py-4 text-lg font-semibold text-linku-text"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            {isLoggedIn ? (
              <OutlineButton href="/me" size="lg">
                <UserCircle2 size={18} /> Mi cuenta
              </OutlineButton>
            ) : (
              <OutlineButton href="/login" size="lg">
                Iniciar sesión
              </OutlineButton>
            )}
            <CoralButton href="#tickets" size="lg">
              Comprar entrada
            </CoralButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
