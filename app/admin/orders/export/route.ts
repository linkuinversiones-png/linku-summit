import { NextResponse, type NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /admin/orders/export?corte=YYYY-MM-DD
 *
 * Descarga un Excel con todos los campos que recoge el registro (tabla
 * orders) hasta la fecha de corte inclusive, en hora de Colombia. Una fila
 * por orden, con su boleta y su estado en InContacto.
 *
 * Los route handlers no pasan por el layout de /admin, así que el guard de
 * admin se repite aquí.
 */

export const dynamic = 'force-dynamic';

const TZ = 'America/Bogota';

function fmt(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function fmtDay(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

const STATUS: Record<string, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
  expired: 'Expirada'
};

const METHOD: Record<string, string> = {
  wompi: 'Wompi',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  bono: 'Bono',
  cortesia: 'Cortesía',
  otro: 'Otro'
};

const INCONTACTO: Record<string, string> = {
  sent: 'Enviado',
  error: 'Error',
  skipped: 'Omitido'
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/admin/orders', request.url));
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  // Corte: por defecto hoy en Colombia. Incluye todo el día de corte.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const raw = request.nextUrl.searchParams.get('corte') ?? '';
  const corte = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  const cutoffIso = new Date(`${corte}T23:59:59.999-05:00`).toISOString();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .lte('created_at', cutoffIso)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = orders ?? [];
  const orderIds = rows.map((o) => o.id);
  const [{ data: tickets }, { data: tiers }] = await Promise.all([
    orderIds.length
      ? supabase
          .from('tickets_issued')
          .select('order_id, qr_code, status, used_at, created_at')
          .in('order_id', orderIds)
      : Promise.resolve({ data: [] as Array<Record<string, string | null>> }),
    supabase.from('ticket_tiers').select('slug, name_es')
  ]);

  const ticketByOrder = new Map<string, Record<string, string | null>>();
  (tickets ?? []).forEach((t) => ticketByOrder.set(t.order_id as string, t));
  const tierName = new Map<string, string>();
  (tiers ?? []).forEach((t) => tierName.set(t.slug, t.name_es));

  const generatedAt = fmt(new Date().toISOString());

  const header = [
    'Referencia',
    'Fecha de registro',
    'Fecha de pago',
    'Estado',
    'Medio de pago',
    'Entrada',
    'Subtotal COP',
    'Descuento COP',
    'Cupón',
    'Total COP',
    'Nombre',
    'Correo',
    'Teléfono',
    'Tipo de documento',
    'Número de documento',
    'Empresa',
    'Cargo',
    'LinkedIn',
    'Facturación igual al comprador',
    'Facturación: nombre',
    'Facturación: tipo doc',
    'Facturación: número doc',
    'Facturación: correo',
    'Facturación: dirección',
    'Tiene cuenta',
    'InContacto',
    'InContacto: fecha',
    'InContacto: detalle',
    'Boleta emitida',
    'Boleta: código',
    'Boleta: usada el',
    'ID pasarela'
  ];

  const body = rows.map((o) => {
    const t = ticketByOrder.get(o.id);
    return [
      o.payment_reference,
      fmt(o.created_at),
      fmt(o.paid_at),
      STATUS[o.status] ?? o.status,
      o.payment_method ? METHOD[o.payment_method] ?? o.payment_method : '',
      tierName.get(o.ticket_tier) ?? o.ticket_tier,
      o.subtotal_cop,
      o.discount_cop,
      o.coupon_code ?? '',
      o.total_cop,
      o.buyer_name ?? '',
      o.buyer_email ?? '',
      o.buyer_phone ?? '',
      o.buyer_doc_type ?? '',
      o.buyer_doc_number ?? '',
      o.buyer_company ?? '',
      o.buyer_position ?? '',
      o.buyer_linkedin ?? '',
      o.billing_same ? 'Sí' : 'No',
      o.billing_name ?? '',
      o.billing_doc_type ?? '',
      o.billing_doc_number ?? '',
      o.billing_email ?? '',
      o.billing_address ?? '',
      o.user_id ? 'Sí' : 'No',
      o.incontacto_status ? INCONTACTO[o.incontacto_status] ?? o.incontacto_status : 'Sin enviar',
      fmt(o.incontacto_synced_at),
      o.incontacto_error ?? '',
      t ? 'Sí' : 'No',
      t?.qr_code ?? '',
      fmt(t?.used_at),
      o.payment_provider_id ?? ''
    ];
  });

  // --- Hoja 1: registros ------------------------------------------------
  const sheet = XLSX.utils.aoa_to_sheet([
    ['LinkU Capital Summit 2026 · Registro de ventas'],
    [`Fecha de corte: ${fmtDay(corte)} (incluye todo el día, hora de Colombia)`],
    [`Generado: ${generatedAt} · ${rows.length} registro(s)`],
    [],
    header,
    ...body
  ]);
  sheet['!cols'] = header.map((h, i) => ({
    wch: Math.min(
      48,
      Math.max(h.length + 2, ...body.map((r) => String(r[i] ?? '').length + 2))
    )
  }));
  sheet['!freeze'] = { xSplit: 0, ySplit: 5 };

  // --- Hoja 2: resumen por estado -------------------------------------
  const byStatus = new Map<string, { n: number; cop: number }>();
  for (const o of rows) {
    const b = byStatus.get(o.status) ?? { n: 0, cop: 0 };
    b.n += 1;
    b.cop += o.total_cop ?? 0;
    byStatus.set(o.status, b);
  }
  const summary = XLSX.utils.aoa_to_sheet([
    ['Resumen al corte', fmtDay(corte)],
    [],
    ['Estado', 'Órdenes', 'Total COP'],
    ...[...byStatus.entries()].map(([s, b]) => [STATUS[s] ?? s, b.n, b.cop]),
    [],
    ['Total', rows.length, rows.reduce((a, o) => a + (o.total_cop ?? 0), 0)]
  ]);
  summary['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Ventas');
  XLSX.utils.book_append_sheet(wb, summary, 'Resumen');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const filename = `ventas-linku-summit-corte-${corte}.xlsx`;

  return new NextResponse(out, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}
