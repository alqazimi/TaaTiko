import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnv(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Strip accidental quotes / whitespace from Vercel paste.
  return value.trim().replace(/^['"]|['"]$/g, '');
}

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const anon = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !url.includes('your-project') &&
    anon.length > 20 &&
    anon !== 'placeholder' &&
    anon !== 'your-anon-key',
);

export const supabaseConfigStatus = {
  hasUrl: Boolean(url),
  hasAnonKey: anon.length > 20,
  urlHost: url ? (() => {
    try {
      return new URL(url).host;
    } catch {
      return '(invalid url)';
    }
  })() : '(missing)',
  anonKeyLength: anon.length,
};

if (!isSupabaseConfigured) {
  console.error('Supabase env missing at build time', supabaseConfigStatus);
}

function createConfiguredClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    // Do not call real project URL without an apikey — that yields:
    // "No API key found in request"
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        apikey: anon,
      },
    },
  });
}

export const supabase = createConfiguredClient();

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
