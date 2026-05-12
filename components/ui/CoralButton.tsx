import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
};

export default function CoralButton({ href, children, size = 'md', className = '' }: Props) {
  const sizes = {
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl bg-linku-coral font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft hover:shadow-coral-glow-strong focus:outline-none focus:ring-2 focus:ring-linku-coral/60 ${sizes[size]} ${className}`;
  if (isExternal) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
