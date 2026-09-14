/**
 * Constantes de cupones que necesita también el navegador (formulario del
 * admin). Viven aparte de lib/coupons.ts porque ese módulo importa el
 * cliente Supabase de servidor y no se puede cargar en un client component.
 */

/**
 * Dos clases de cupón:
 *   descuento → rebaja parcial, la orden sigue a Wompi por el saldo.
 *   cortesia  → 100 %, la orden queda pagada sin pasar por la pasarela
 *               (Wompi no acepta cobros de $0).
 */
export type CouponKind = 'descuento' | 'cortesia';

export const COURTESY_CATEGORIES = [
  { value: 'aliado', label: 'Aliado' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'prensa', label: 'Prensa' },
  { value: 'staff', label: 'Staff / equipo' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'invitado', label: 'Invitado especial' },
  { value: 'otro', label: 'Otro' }
] as const;

export const COURTESY_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  COURTESY_CATEGORIES.map((c) => [c.value, c.label])
);
