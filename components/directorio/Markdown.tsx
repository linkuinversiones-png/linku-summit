import { Fragment } from 'react';
import Link from 'next/link';

/**
 * Renderer markdown server-side, hecho a la medida del directorio LINKU.
 * Soporta: H2/H3, párrafos, listas (`-` y `1.`), blockquotes (`>`),
 * inline bold/italic/links y saltos forzados con `  \n`. Sin tablas ni imágenes
 * (el contenido del directorio no los usa).
 */
export default function Markdown({ source }: { source: string }) {
  const blocks = splitBlocks(source);
  return (
    <div className="space-y-6 text-base leading-relaxed text-linku-text-muted sm:text-[17px]">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; text: string };

function splitBlocks(source: string): Block[] {
  const out: Block[] = [];
  const blocks = source.split(/\n\s*\n/);

  for (const raw of blocks) {
    const block = raw.replace(/\n$/, '').trim();
    if (!block) continue;

    // H2 / H3
    const h = block.match(/^(#{2,3})\s+(.+)$/);
    if (h && !block.includes('\n')) {
      const level = h[1].length;
      out.push(level === 2 ? { type: 'h2', text: h[2] } : { type: 'h3', text: h[2] });
      continue;
    }

    // Blockquote: cada línea empieza con `>`
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('>'))) {
      const text = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
      out.push({ type: 'blockquote', text });
      continue;
    }

    // Lista ordenada: cada línea empieza con `\d+. `
    if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      out.push({
        type: 'ol',
        items: lines.map((l) => l.replace(/^\d+\.\s+/, ''))
      });
      continue;
    }

    // Lista no ordenada: cada línea empieza con `- `
    if (lines.every((l) => /^-\s+/.test(l))) {
      out.push({
        type: 'ul',
        items: lines.map((l) => l.replace(/^-\s+/, ''))
      });
      continue;
    }

    // Párrafo (soporta line break con `  \n`)
    out.push({ type: 'p', text: block });
  }

  return out;
}

function Block({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="mt-12 font-bold tracking-tightish text-linku-text text-[clamp(1.5rem,2.8vw,2rem)] leading-tight">
          <Inline text={block.text} />
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-8 text-lg font-bold tracking-tight text-linku-text sm:text-xl">
          <Inline text={block.text} />
        </h3>
      );
    case 'blockquote':
      return (
        <blockquote className="rounded-2xl border border-linku-coral/30 bg-linku-coral/[0.06] p-5 text-base text-linku-text leading-relaxed sm:p-6 sm:text-lg">
          <Inline text={block.text} />
        </blockquote>
      );
    case 'ul':
      return (
        <ul className="ml-5 list-disc space-y-2 marker:text-linku-coral">
          {block.items.map((it, i) => (
            <li key={i} className="pl-1 text-linku-text-muted">
              <Inline text={it} />
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="ml-5 list-decimal space-y-2 marker:font-semibold marker:text-linku-coral">
          {block.items.map((it, i) => (
            <li key={i} className="pl-1 text-linku-text-muted">
              <Inline text={it} />
            </li>
          ))}
        </ol>
      );
    case 'p':
      return (
        <p>
          <Inline text={block.text} multiline />
        </p>
      );
  }
}

/**
 * Inline renderer: maneja `**bold**`, `*italic*`, `[text](url)` y saltos
 * forzados markdown (`  \n` → <br/>). Los enlaces relativos a linkusummit.com
 * se renderizan con next/link.
 */
function Inline({ text, multiline = false }: { text: string; multiline?: boolean }) {
  if (multiline) {
    // Convertir saltos con dos espacios al final en <br/>
    const segments = text.split(/  \n/);
    return (
      <>
        {segments.map((seg, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(seg)}
          </Fragment>
        ))}
      </>
    );
  }
  return <>{renderInline(text)}</>;
}

function renderInline(text: string) {
  // Tokens combinados: bold | italic | link
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    if (match[1] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-linku-text">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      out.push(
        <em key={key++} className="italic">
          {match[2]}
        </em>
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      const label = match[3];
      const isInternal = href.startsWith('/') || href.includes('linkusummit.com');
      if (isInternal) {
        const internalHref = href.replace(/^https?:\/\/linkusummit\.com/, '');
        out.push(
          <Link
            key={key++}
            href={internalHref || '/'}
            className="text-linku-coral underline-offset-2 hover:underline"
          >
            {label}
          </Link>
        );
      } else {
        out.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-linku-coral underline-offset-2 hover:underline"
          >
            {label}
          </a>
        );
      }
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return out;
}
