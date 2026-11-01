import { trackEvent } from './src/services/analytics';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { I18nProvider } from './src/i18n';
const PrivacyCenter = React.lazy(() => import('./src/components/PrivacyCenter'));
const ConsentBanner = React.lazy(() => import('./src/components/ConsentBanner'));

// Anything that crashes in someone's browser is recorded (message and where, never journal text)
window.addEventListener('error', e => { trackEvent('client_error', { message: String(e.message).slice(0, 300), where: `${e.filename}:${e.lineno}:${e.colno}`, stack: String((e as any).error?.stack ?? '').slice(0, 1200) }); });
window.addEventListener('unhandledrejection', e => { trackEvent('client_error', { message: String((e as any).reason?.message ?? e.reason).slice(0, 300), stack: String((e as any).reason?.stack ?? '').slice(0, 1200) }); });

/** A crash on one screen shows a way back instead of a blank page, and is recorded so it can be fixed. */
class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: any, info: any) {
    trackEvent('render_error', { message: String(error?.message ?? error).slice(0, 300), stack: String(error?.stack ?? '').slice(0, 1200), component: String(info?.componentStack ?? '').slice(0, 1200) });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Merriweather, serif', fontSize: 24, color: '#0f172a', marginBottom: 12 }}>Something went wrong on this screen.</p>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Your journal is safe. Reload to try again.</p>
          <button onClick={() => window.location.reload()} style={{ height: 48, padding: '0 24px', borderRadius: 999, background: '#0f172a', color: '#fff', fontWeight: 700, border: 0 }}>Reload</button>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Boundary>
      <I18nProvider>
        <App />
        <React.Suspense fallback={null}><PrivacyCenter /><ConsentBanner /></React.Suspense>
      </I18nProvider>
    </Boundary>
  </React.StrictMode>
);
