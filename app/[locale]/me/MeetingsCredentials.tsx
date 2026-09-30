'use client';

import { useState } from 'react';

type Labels = {
  title: string;
  user: string;
  password: string;
  show: string;
  hide: string;
  copy: string;
  copied: string;
  hint: string;
};

const BTN =
  'shrink-0 rounded-lg border border-linku-border-2 px-3 py-1.5 text-xs font-semibold text-linku-text-muted transition hover:border-white/25 hover:text-linku-text';

/** Copia al portapapeles; si el navegador no deja, falla en silencio. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Recuadro con usuario (correo) y clave de la plataforma externa de citas. */
export default function MeetingsCredentials({
  email,
  password,
  labels
}: {
  email: string;
  password: string;
  labels: Labels;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<'user' | 'password' | null>(null);

  async function copy(which: 'user' | 'password', text: string) {
    if (await copyText(text)) {
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-linku-border-2 bg-linku-bg-3 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
        {labels.title}
      </p>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <dt className="text-[11px] text-linku-text-dim">{labels.user}</dt>
            <dd className="truncate text-linku-text">{email}</dd>
          </div>
          <button type="button" className={BTN} onClick={() => copy('user', email)}>
            {copied === 'user' ? labels.copied : labels.copy}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <dt className="text-[11px] text-linku-text-dim">{labels.password}</dt>
            <dd className="truncate font-mono text-linku-text">{show ? password : '••••••'}</dd>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className={BTN} onClick={() => setShow((x) => !x)}>
              {show ? labels.hide : labels.show}
            </button>
            <button type="button" className={BTN} onClick={() => copy('password', password)}>
              {copied === 'password' ? labels.copied : labels.copy}
            </button>
          </div>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-linku-text-dim">{labels.hint}</p>
    </div>
  );
}
