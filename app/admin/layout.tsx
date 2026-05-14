import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin · LINKU SUMMIT 2026',
  robots: { index: false, follow: false }
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/?error=unauthorized');
  }

  return (
    <AdminShell email={user.email ?? ''} fullName={profile?.full_name ?? ''}>
      {children}
    </AdminShell>
  );
}
