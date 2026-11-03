import type { CapacitorConfig } from '@capacitor/cli';

// The native apps (iOS and Android) wrap the same Vite build as belluh.com. See docs/native-app.md.
// The bundle id is com.belluh.app on both stores; change it here and in ios/ and android/ together if it ever must change.
const config: CapacitorConfig = {
  appId: 'com.belluh.app',
  appName: 'Belluh',
  webDir: 'dist',
  // Pages load from https://localhost on Android (and capacitor://localhost on iOS), so Supabase, IndexedDB and the
  // model caches behave like they do on the web.
  server: { androidScheme: 'https' },
  // The site's viewport is not viewport-fit=cover, so the WebView keeps clear of the notch and the home bar
  ios: { contentInset: 'automatic' },
  android: { allowMixedContent: false },
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    SystemBars: { insetsHandling: 'native' },
  },
};

export default config;
