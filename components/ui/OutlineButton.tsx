import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
};

export default function OutlineButton({ href, children, size = 'md', className = '' }: Props) {
  const sizes = {
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl border border-linku-border-2 bg-transparent font-semibold text-linku-text transition hover:border-white/25 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 ${sizes[size]} ${className}`;
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
