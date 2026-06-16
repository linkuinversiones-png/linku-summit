import { Fragment } from 'react';

/**
 * Parser mínimo de markdown inline para el copy del directorio.
 * Soporta **negrita** y *cursiva* sin dependencias externas.
 * El texto del directorio vive en archivos .ts; usamos esto en lugar de MDX
 * para mantener la pipeline simple y server-rendered.
 */
export default function RichText({ text, className }: { text: string; className?: string }) {
  const parts = parseInline(text);
  return <span className={className}>{parts}</span>;
}

function parseInline(text: string) {
  const tokens: Array<string | { kind: 'b' | 'i'; value: string }> = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) tokens.push({ kind: 'b', value: match[1] });
    else if (match[2] !== undefined) tokens.push({ kind: 'i', value: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));

  return tokens.map((t, i) => {
    if (typeof t === 'string') return <Fragment key={i}>{t}</Fragment>;
    if (t.kind === 'b')
      return (
        <strong key={i} className="font-semibold text-linku-text">
          {t.value}
        </strong>
      );
    return (
      <em key={i} className="italic">
        {t.value}
      </em>
    );
  });
}
