'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, UserCircle2 } from 'lucide-react';
import CoralButton from '@/components/ui/CoralButton';
import OutlineButton from '@/components/ui/OutlineButton';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import { localizePath, type Locale } from '@/lib/i18n/config';
import type { UiContent } from '@/lib/i18n/content';

type Props = {
  contacts: { sponsors: string; invites: string; partners: string };
  isLoggedIn?: boolean;
  locale: Locale;
  ui: UiContent['nav'];
};

export default function Navbar({ isLoggedIn = false, locale, ui }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const homeHref = localizePath('/', locale);
  const meHref = localizePath('/me', locale);
  const loginHref = localizePath('/login', locale);

  const navLinks = [
    { href: '#agenda', label: ui.links.agenda },
    { href: '#speakers', label: ui.links.speakers },
    { href: '#tesis', label: ui.links.tracks },
    { href: '#tickets', label: ui.links.tickets },
    { href: '#sponsors', label: ui.links.sponsors },
    { href: '#faq', label: ui.links.faq }
  ];

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

  // Cierra el menú al cambiar la URL hash (ancla de sección).
  // Garantiza el cierre aunque el onClick no alcance a procesarse.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
        scrolled
          ? 'border-b border-linku-border bg-linku-bg/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link href={homeHref} className="flex items-center gap-3" aria-label="LinkU Summit 2026">
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
          {navLinks.map((l) => (
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
          <LocaleSwitcher currentLocale={locale} />
          {isLoggedIn ? (
            <OutlineButton href={meHref}>
              <UserCircle2 size={16} /> {ui.account}
            </OutlineButton>
          ) : (
            <OutlineButton href={loginHref}>{ui.login}</OutlineButton>
          )}
          <CoralButton href="#tickets">{ui.buy}</CoralButton>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LocaleSwitcher currentLocale={locale} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-linku-border-2 p-2 text-linku-text"
            aria-label={ui.openMenu}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-linku-bg transition lg:hidden ${
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
            aria-label={ui.closeMenu}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-5 pt-4 sm:px-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-linku-border py-4 text-lg font-semibold text-linku-text"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3" onClick={() => setOpen(false)}>
            {isLoggedIn ? (
              <OutlineButton href={meHref} size="lg">
                <UserCircle2 size={18} /> {ui.account}
              </OutlineButton>
            ) : (
              <OutlineButton href={loginHref} size="lg">
                {ui.login}
              </OutlineButton>
            )}
            <CoralButton href="#tickets" size="lg">
              {ui.buy}
            </CoralButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
