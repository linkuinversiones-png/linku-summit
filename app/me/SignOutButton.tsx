'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-linku-border-2 px-3 py-2 text-xs font-semibold text-linku-text-muted transition hover:border-white/25 hover:bg-white/5 hover:text-linku-text disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <LogOut size={14} />
      )}
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
