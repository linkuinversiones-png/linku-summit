/**
 * Tipos de bloque de agenda. Fuente única de verdad: la usan tanto la
 * validación server-side (actions.ts) como el <select> del editor.
 * El `label` es solo para el admin; el landing pinta su propio label por locale.
 */
export const ITEM_TYPES = [
  { value: 'registro', label: 'Registro' },
  { value: 'apertura', label: 'Apertura' },
  { value: 'charla', label: 'Charla' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel' },
  { value: 'break', label: 'Break' },
  { value: 'comida', label: 'Comida' },
  { value: 'networking', label: 'Networking' },
  { value: 'feria', label: 'Feria' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'salones', label: 'Salones paralelos' },
  { value: 'relacionamiento', label: 'Relacionamiento' },
  { value: 'vip', label: 'VIP' }
] as const;

export const ITEM_TYPE_VALUES: string[] = ITEM_TYPES.map((t) => t.value);
