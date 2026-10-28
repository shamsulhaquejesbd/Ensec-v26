import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://rcngtmnqukrudueendns.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_yJIfJO_0XV2FO7mhpEebhA_qv-OqnNM';
const STORAGE_KEY_URL = 'ensec_supabase_url';
const STORAGE_KEY_ANON = 'ensec_supabase_anon_key';
const STORAGE_PROJECT_ID_KEY = 'ensec_supabase_configured_project_id';
const CURRENT_PROJECT_ID = 'rcngtmnqukrudueendns';

// Migrate or initialize localStorage to the current Supabase project
if (typeof window !== 'undefined') {
  try {
    const currentSavedProjectId = localStorage.getItem(STORAGE_PROJECT_ID_KEY);
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const savedAnon = localStorage.getItem(STORAGE_KEY_ANON);

    const isUrlInvalid = !savedUrl || !savedUrl.startsWith('http') || savedUrl.includes('xyzproject');
    const isAnonInvalid = !savedAnon || savedAnon.trim().length < 10 || savedAnon === 'your-anon-key' || savedAnon === 'undefined' || savedAnon === 'null';

    // If not set yet, set to an old project, or has corrupted/missing keys, reset to active project
    if (currentSavedProjectId !== CURRENT_PROJECT_ID || isUrlInvalid || isAnonInvalid) {
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_SUPABASE_URL);
      localStorage.setItem(STORAGE_KEY_ANON, DEFAULT_SUPABASE_ANON_KEY);
      localStorage.setItem(STORAGE_PROJECT_ID_KEY, CURRENT_PROJECT_ID);
    }
  } catch (e) {
    console.warn('Supabase localStorage migration notice:', e);
  }
}

export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    if (saved && saved.startsWith('http') && saved !== 'undefined' && saved !== 'null') return saved.trim();
  }
  return (import.meta.env?.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_ANON);
    if (saved && saved.trim().length > 10 && saved !== 'undefined' && saved !== 'null') return saved.trim();
  }
  return (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const checkSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
};

export const isSupabaseConfigured: boolean = checkSupabaseConfigured();

export const supabase = getSupabase();

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    cachedClient = null;
    window.dispatchEvent(new Event('ensec-supabase-config-changed'));
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    cachedClient = null;
    window.dispatchEvent(new Event('ensec-supabase-config-changed'));
  }
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const client = createClient(url.trim(), anonKey.trim());
    const { error } = await client.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      if (error.message && error.message.includes('fetch')) {
        return { success: false, message: `Network/CORS error: ${error.message}` };
      }
      if (error.code === '42P01') {
        return { success: true, message: 'Connected to Supabase! (Database tables need migration).' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.' };
  }
};

export const testProductsTableConnection = async (
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; tableExists: boolean; rowCount?: number }> => {
  try {
    const client = url && anonKey ? createClient(url.trim(), anonKey.trim()) : getSupabase();
    if (!client) {
      return { success: false, message: 'Supabase client is not configured.', tableExists: false };
    }
    const { data, count, error } = await client.from('products').select('id', { count: 'exact' }).limit(1);
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('relation "public.products" does not exist'))) {
        return { success: true, message: 'Connected to Supabase! But the "products" table does not exist yet. Please execute the SQL schema in the SQL Editor.', tableExists: false };
      }
      if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
        return { success: false, message: `Permission / RLS error on "products" table: ${error.message}. Enable public access policy in SQL Editor.`, tableExists: true };
      }
      return { success: false, message: `Supabase error: ${error.message}`, tableExists: false };
    }
    const rowCount = count !== null ? count : (data?.length || 0);
    return { success: true, message: `Connected to Supabase! "products" table is online (${rowCount} total products currently stored).`, tableExists: true, rowCount };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.', tableExists: false };
  }
};

