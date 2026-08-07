import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(
  url &&
    anon &&
    !url.includes('placeholder') &&
    !url.includes('your-project') &&
    anon !== 'placeholder' &&
    anon !== 'your-anon-key',
);

if (!isSupabaseConfigured) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in Vercel → Settings → Environment Variables, then Redeploy.',
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? url! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anon! : 'placeholder',
);

export type AdminRole = 'super_admin' | 'course_reviewer' | 'finance_admin' | 'moderator';

export async function fetchAdminRoles(userId: string): Promise<AdminRole[]> {
  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (admin?.is_active) {
    const { data: roles } = await supabase
      .from('admin_user_roles')
      .select('role')
      .eq('user_id', userId);
    return (roles ?? []).map((r) => r.role as AdminRole);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();

  return profile?.is_admin ? (['super_admin'] as AdminRole[]) : [];
}

export function canReview(roles: AdminRole[]) {
  return roles.includes('super_admin') || roles.includes('course_reviewer');
}

export function canFinance(roles: AdminRole[]) {
  return roles.includes('super_admin') || roles.includes('finance_admin');
}

export function canModerate(roles: AdminRole[]) {
  return roles.includes('super_admin') || roles.includes('moderator') || roles.includes('course_reviewer');
}
