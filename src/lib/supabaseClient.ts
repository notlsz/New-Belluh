import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fall back to hardcoded values for preview/development.
// These fallbacks ensure the app doesn't crash on boot if keys aren't set in Vercel yet.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ctbsycrlakdanfzbaqmz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0YnN5Y3JsYWtkYW5memJhcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzI4NDAsImV4cCI6MjA1OTA0ODg0MH0.N7XQO1gdNuSglB1FFC938ii6gjh5Baku9cOsl0BQ4q8';

if (!supabaseUrl) {
  console.error("Supabase URL is missing. The app may crash.");
}

// Saving the login can fail (storage full, private browsing, blocked site data). When it does, keep it in memory for
// this visit instead of failing the sign-in: the person still gets in, they just sign in again next visit.
const memory = new Map<string, string>();
const safeStorage = {
  getItem: (k: string) => { try { const v = window.localStorage.getItem(k); if (v !== null) return v; } catch { /* blocked */ } return memory.get(k) ?? null; },
  setItem: (k: string, v: string) => { memory.set(k, v); try { window.localStorage.setItem(k, v); } catch { /* full or blocked: memory has it */ } },
  removeItem: (k: string) => { memory.delete(k); try { window.localStorage.removeItem(k); } catch { /* blocked */ } },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage, // the browser's storage, or memory when it's full or blocked, so signing in always works
  }
});
/**
 * A client that reads as one signed-in person, with their login attached to every request. Used to load the journal
 * right after signing in, so the reads never depend on the browser having finished saving the session.
 */
const readers = new Map<string, typeof supabase>();
export function readAs(accessToken: string) {
  let c = readers.get(accessToken);
  if (!c) {
    readers.clear();
    c = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'belluh-reader' },
    }) as typeof supabase;
    readers.set(accessToken, c);
  }
  return c;
}
