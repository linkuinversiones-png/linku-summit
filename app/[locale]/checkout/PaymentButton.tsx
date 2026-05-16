'use client';

import { ArrowRight } from 'lucide-react';
import { EPAYCO_CHECKOUT_URL } from '@/lib/epayco/config';

type Props = {
  customerId: string;
  pKey: string; // EPAYCO_P_KEY — va al form `p_key` Y se usa para firmar
  invoiceId: string;
  amount: number; // COP entero (no centavos)
  currency: string;
  signature: string;
  testMode: boolean;
  description: string;
  responseUrl: string;
  confirmationUrl: string;
  customerEmail: string;
  locale: 'es' | 'en';
  label: string;
};

/**
 * Botón de pago: hace POST form al Checkout estándar de ePayco.
 * ePayco abre su pasarela en la misma pestaña; al terminar, redirige
 * a `p_url_response` y notifica al webhook `p_url_confirmation`.
 *
 * Importante: el campo `p_key` del form lleva la P_KEY (la misma usada
 * para firmar), NO la PUBLIC_KEY del dashboard. Convención histórica
 * de ePayco: la PUBLIC_KEY se usa solo para SDK Onpage / Smart Checkout v2.
 *
 * Doc: https://docs.epayco.co/payments/checkout
 */
export default function PaymentButton({
  customerId,
  pKey,
  invoiceId,
  amount,
  currency,
  signature,
  testMode,
  description,
  responseUrl,
  confirmationUrl,
  customerEmail,
  locale,
  label
}: Props) {
  return (
    <form
      action={EPAYCO_CHECKOUT_URL}
      method="POST"
      target="_self"
      className="w-full"
    >
      <input type="hidden" name="p_cust_id_cliente" value={customerId} />
      <input type="hidden" name="p_key" value={pKey} />
      <input type="hidden" name="p_id_invoice" value={invoiceId} />
      <input type="hidden" name="p_description" value={description} />
      <input type="hidden" name="p_amount" value={amount} />
      <input type="hidden" name="p_amount_base" value={amount} />
      <input type="hidden" name="p_tax" value={0} />
      <input type="hidden" name="p_currency_code" value={currency} />
      <input type="hidden" name="p_signature" value={signature} />
      <input
        type="hidden"
        name="p_test_request"
        value={testMode ? 'TRUE' : 'FALSE'}
      />
      <input type="hidden" name="p_url_response" value={responseUrl} />
      <input type="hidden" name="p_url_confirmation" value={confirmationUrl} />
      <input type="hidden" name="p_confirm_method" value="POST" />
      <input type="hidden" name="p_lang" value={locale === 'en' ? 'en' : 'es'} />
      {customerEmail && (
        <input type="hidden" name="p_email" value={customerEmail} />
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
