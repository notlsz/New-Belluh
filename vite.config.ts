
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // The Gemini key is never bundled: AI runs through the gemini-proxy server function.
  
  // Music Provider Keys
  const spotifyClientId = env.VITE_SPOTIFY_CLIENT_ID || '';
  const appleDeveloperToken = env.VITE_APPLE_DEVELOPER_TOKEN || '';

  return {
    plugins: [react()],
    // This defines process.env variables globally for the browser at BUILD time.
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'process.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(spotifyClientId),
      'process.env.VITE_APPLE_DEVELOPER_TOKEN': JSON.stringify(appleDeveloperToken),
    },
  };
});
