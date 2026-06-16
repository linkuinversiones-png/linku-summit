import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="text-xs text-linku-text-dim">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-linku-coral">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-linku-text-muted">
                  {c.label}
                </span>
              )}
              {!isLast && <ChevronRight size={12} aria-hidden className="text-linku-text-dim" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
