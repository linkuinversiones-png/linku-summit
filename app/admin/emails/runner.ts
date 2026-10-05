import { processCampaignBatch, type Progress } from './actions';

/**
 * Llama "procesar lote" una y otra vez hasta terminar. Se detiene si hay un
 * error, si el usuario pide parar, o si 3 vueltas seguidas no avanzan
 * (evita un ciclo infinito).
 */
export async function runCampaign(
  campaignId: string,
  onProgress: (p: Progress) => void,
  shouldStop: () => boolean
): Promise<{ ok: boolean; message?: string }> {
  let stalled = 0;
  let last = -1;
  for (;;) {
    if (shouldStop()) return { ok: true, message: 'Envío en pausa. Puedes continuar desde el historial.' };
    let res;
    try {
      res = await processCampaignBatch(campaignId);
    } catch (e) {
      return {
        ok: false,
        message: `Se perdió la conexión (${e instanceof Error ? e.message : 'error'}). La campaña sigue en cola: continúala desde el historial.`
      };
    }
    if (res.progress) onProgress(res.progress);
    if (!res.ok) return { ok: false, message: res.message };
    if (res.done) {
      const p = res.progress;
      return {
        ok: true,
        message: res.message
          ? `Terminó con errores: ${res.message}`
          : p.sent + p.failed >= p.total && p.sending === 0
            ? undefined
            : 'Quedan destinatarios en corte; usa "Reintentar" en el historial.'
      };
    }
    const advanced = res.progress.sent + res.progress.failed;
    stalled = advanced === last ? stalled + 1 : 0;
    last = advanced;
    if (stalled >= 3) {
      return { ok: false, message: 'El envío no avanza. Revisa el historial e inténtalo de nuevo.' };
    }
  }
}
