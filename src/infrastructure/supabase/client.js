import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

// Credenciales válidas (no placeholders). Sin ellas la app corre en modo demo con datos locales.
export const isSupabaseConfigured =
    supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your_');

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
        global: {
            // Timeout de 15s para no dejar la UI colgada con conexiones lentas.
            fetch: (url, options = {}) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                options.signal?.addEventListener('abort', () => controller.abort());
                return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
            },
        },
    })
    : null;
