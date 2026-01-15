import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fall back to hardcoded values for preview/development.
// These fallbacks ensure the app doesn't crash on boot if keys aren't set in Vercel yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ctbsycrlakdanfzbaqmz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0YnN5Y3JsYWtkYW5memJhcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzI4NDAsImV4cCI6MjA1OTA0ODg0MH0.N7XQO1gdNuSglB1FFC938ii6gjh5Baku9cOsl0BQ4q8';

if (!supabaseUrl) {
  console.error("Supabase URL is missing. The app may crash.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage // Explicitly use localStorage
  }
});