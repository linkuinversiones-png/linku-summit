import { existsSync, readFileSync } from 'fs';
import path from 'path';

const EVENTOS_DIR = path.join(process.cwd(), 'content', 'directorio', 'eventos');

export type EventoFrontmatter = {
  title?: string;
  description?: string;
  canonical?: string;
  slug?: string;
  author?: string;
  updated?: string;
  lang?: string;
  keywords?: string;
};

export type EventoDoc = {
  frontmatter: EventoFrontmatter;
  /** H1 ya extraído del cuerpo. */
  h1: string;
  /** Cuerpo del artículo sin frontmatter, sin H1 y sin la "Nota de procedencia". */
  body: string;
  /** Pares pregunta/respuesta extraídos de la sección "## Preguntas frecuentes". */
  faqs: Array<{ q: string; a: string }>;
};

/** Lee y parsea un .md de evento del directorio. Devuelve null si no existe. */
export function loadEvento(slug: string): EventoDoc | null {
  const filePath = path.join(EVENTOS_DIR, `${slug}.md`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const { frontmatter, content } = splitFrontmatter(raw);

  // Cortamos todo desde el primer separador horizontal (`---` standalone),
  // que es donde empieza la "Nota de procedencia" editorial.
  const cutIdx = findHorizontalRuleIndex(content);
  const trimmed = (cutIdx >= 0 ? content.slice(0, cutIdx) : content).trim();

  // Extraer H1.
  const h1Match = trimmed.match(/^#\s+(.+?)\s*$/m);
  const h1 = h1Match ? h1Match[1].trim() : '';
  const body = h1Match
    ? trimmed.slice((h1Match.index ?? 0) + h1Match[0].length).replace(/^\n+/, '').trim()
    : trimmed;

  const faqs = extractFaqs(body);

  return { frontmatter, h1, body, faqs };
}

function splitFrontmatter(raw: string): {
  frontmatter: EventoFrontmatter;
  content: string;
} {
  // Frontmatter YAML simple: ---\n key: "value"\n ... \n---\n
  const fm: EventoFrontmatter = {};
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { frontmatter: fm, content: raw };

  const yaml = m[1];
  const content = m[2];
  for (const line of yaml.split('\n')) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*?)\s*$/);
    if (!kv) continue;
    let value = kv[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    (fm as Record<string, string>)[kv[1]] = value;
  }
  return { frontmatter: fm, content };
}

/** Encuentra la posición del primer `---` (separador horizontal) en su línea. */
function findHorizontalRuleIndex(text: string): number {
  const m = text.match(/^---\s*$/m);
  return m && m.index !== undefined ? m.index : -1;
}

/**
 * Extrae preguntas y respuestas de la sección `## Preguntas frecuentes`.
 * Formato esperado:
 *   ## Preguntas frecuentes
 *
 *   **¿Pregunta?**
 *   Respuesta.
 *
 *   **¿Otra?**
 *   Otra respuesta.
 */
function extractFaqs(body: string): Array<{ q: string; a: string }> {
  const out: Array<{ q: string; a: string }> = [];
  const m = body.match(/##\s+Preguntas frecuentes\s*\n([\s\S]*?)(?=\n##\s|$)/);
  if (!m) return out;
  const section = m[1];

  // Bloques separados por línea vacía.
  const blocks = section.split(/\n\s*\n/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const q = trimmed.match(/^\*\*(.+?)\*\*\s*\n([\s\S]+)$/);
    if (!q) continue;
    out.push({
      q: q[1].trim(),
      a: stripInlineMarkdown(q[2].trim().replace(/\n+/g, ' ').replace(/\s{2,}/g, ' '))
    });
  }
  return out;
}

function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1');
}
