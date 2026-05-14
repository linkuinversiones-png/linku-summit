'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Polling silencioso del status de la orden cada 4s.
 * Se monta solo cuando la orden está pending. Cuando el webhook
 * confirma el pago y la orden pasa a 'paid' o 'failed', refresh
 * el server component padre para re-renderizar con el nuevo estado.
 */
export default function StatusPoll({ reference }: { reference: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(`/api/orders/status?ref=${encodeURIComponent(reference)}`, {
          cache: 'no-store'
        });
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (data.status && data.status !== 'pending') {
          router.refresh();
          return;
        }
      } catch {
        // ignorar errores transitorios
      }
      // Hasta 30 intentos (~2 min). Después dejamos en pending visualmente.
      if (attempts < 30 && !cancelled) {
        setTimeout(tick, 4000);
      }
    };

    setTimeout(tick, 2000);
    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return null;
}
