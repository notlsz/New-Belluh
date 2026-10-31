
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// belluh.com/about gets its own title, description and preview card when the link is shared (iMessage, Slack, X read
// these from the HTML without running the app), so the build writes about.html: the same app, its own meta tags.
const ABOUT_META = {
  title: 'The Supermarket Moment | Belluh',
  description: "Why Belluh exists: an evening in a supermarket, a question that kept me up until 2 a.m., and a world of perfect documentation and zero remembrance.",
  url: 'https://belluh.com/about',
  image: 'https://belluh.com/og-supermarket.jpg',
  imageAlt: 'A long supermarket aisle under bright lights, in black and white.',
};
function aboutPage() {
  let outDir = 'dist';
  return {
    name: 'belluh-about-page',
    configResolved(c: any) { outDir = c.build.outDir; },
    closeBundle() {
      const file = path.resolve(outDir, 'index.html');
      if (!fs.existsSync(file)) return;
      const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const m = ABOUT_META;
      let html = fs.readFileSync(file, 'utf8')
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(m.description)}`)
        .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(m.title)}`)
        .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(m.description)}`)
        .replace(/(<meta property="og:url" content=")[^"]*/, `$1${m.url}`)
        .replace(/(<meta property="og:image" content=")[^"]*/, `$1${m.image}`)
        .replace(/(<meta property="og:image:alt" content=")[^"]*/, `$1${esc(m.imageAlt)}`)
        .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(m.title)}`)
        .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(m.description)}`)
        .replace(/(<meta name="twitter:image" content=")[^"]*/, `$1${m.image}`);
      fs.writeFileSync(path.resolve(outDir, 'about.html'), html);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // The Gemini key is never bundled: AI runs through the gemini-proxy server function.
  
  // Music Provider Keys
  const spotifyClientId = env.VITE_SPOTIFY_CLIENT_ID || '';
  const appleDeveloperToken = env.VITE_APPLE_DEVELOPER_TOKEN || '';

  return {
    plugins: [react(), aboutPage()],
    // Emojis instead of line icons, everywhere (see src/lib/emojiIcons.tsx)
    resolve: { alias: { 'lucide-react': path.resolve(__dirname, 'src/lib/emojiIcons.tsx') } },
    // This defines process.env variables globally for the browser at BUILD time.
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      'process.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(spotifyClientId),
      'process.env.VITE_APPLE_DEVELOPER_TOKEN': JSON.stringify(appleDeveloperToken),
    },
  };
});
