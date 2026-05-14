'use client';

import { ArrowRight } from 'lucide-react';

type Props = {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  integritySignature: string;
  redirectUrl: string;
  customerEmail: string;
  label: string;
};

/**
 * Botón de pago: hace POST form a Wompi Web Checkout.
 * Wompi exige que sea form submit del cliente (cross-origin).
 *
 * Doc: https://docs.wompi.co/docs/colombia/widget-checkout-web
 */
export default function PaymentButton({
  publicKey,
  currency,
  amountInCents,
  reference,
  integritySignature,
  redirectUrl,
  customerEmail,
  label
}: Props) {
  return (
    <form
      action="https://checkout.wompi.co/p/"
      method="GET"
      target="_self"
      className="w-full"
    >
      <input type="hidden" name="public-key" value={publicKey} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="amount-in-cents" value={amountInCents} />
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="signature:integrity" value={integritySignature} />
      <input type="hidden" name="redirect-url" value={redirectUrl} />
      {customerEmail && (
        <input type="hidden" name="customer-data:email" value={customerEmail} />
      )}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linku-coral px-6 py-4 text-base font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft hover:shadow-coral-glow-strong"
      >
        {label}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
