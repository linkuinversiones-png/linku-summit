'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

type Phase = 'ssr' | 'hidden' | 'shown';

/**
 * Aparece con un desplazamiento suave al entrar en pantalla.
 *
 * Importante: el HTML que llega del servidor es VISIBLE. Solo cuando el
 * JavaScript ya corrió (useEffect) se oculta el bloque y se arma el observador
 * que lo revela. Antes se usaba framer-motion con `initial={{ opacity: 0 }}`,
 * que dejaba la página en negro para quien no terminaba de cargar los scripts
 * (navegador dentro de WhatsApp, conexión lenta, bloqueadores).
 */
export default function Reveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('ssr');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setPhase('shown');
      return;
    }

    // Si ya está en pantalla al hidratar, no lo escondemos: evitaría un
    // parpadeo de visible → invisible → visible.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setPhase('shown');
      return;
    }

    setPhase('hidden');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('shown');
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties =
    phase === 'hidden'
      ? { opacity: 0, transform: 'translateY(14px)' }
      : phase === 'shown'
        ? {
            opacity: 1,
            transform: 'none',
            transition: `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`
          }
        : {};

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
