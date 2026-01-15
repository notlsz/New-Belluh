
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Sam Altman Fix: Robustly check for the API key across all common naming conventions.
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.GOOGLE_API_KEY || '';
  
  // Music Provider Keys
  const spotifyClientId = env.VITE_SPOTIFY_CLIENT_ID || '';
  const appleDeveloperToken = env.VITE_APPLE_DEVELOPER_TOKEN || '';

  return {
    plugins: [react()],
    // This defines process.env variables globally for the browser at BUILD time.
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'process.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(spotifyClientId),
      'process.env.VITE_APPLE_DEVELOPER_TOKEN': JSON.stringify(appleDeveloperToken),
    },
  };
});
