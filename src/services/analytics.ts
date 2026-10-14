
import { supabase } from '../lib/supabaseClient';

export const trackEvent = async (eventName: string, properties: object = {}) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        // Allow anonymous tracking if needed, but for now stick to authenticated users for quality data
        if (!session?.user) return; 

        // We fire and forget to not block UI
        supabase.from('analytics_events').insert({
            user_id: session.user.id,
            event_name: eventName,
            properties: properties,
        }).then(({ error }) => {
            if (error) console.warn("Analytics write failed:", error.message);
        });
    } catch (error) {
        console.warn("Analytics error:", error);
    }
};

// Landing-page clicks happen before sign-in, so remember which button was used and report it once they're in.
const CTA_KEY = 'belluh_cta';
export const rememberCta = (where: string) => { try { localStorage.setItem(CTA_KEY, JSON.stringify({ where, at: Date.now() })); } catch { /* ignore */ } };
export const flushCta = () => {
    try {
        const raw = localStorage.getItem(CTA_KEY);
        if (!raw) return;
        localStorage.removeItem(CTA_KEY);
        const { where, at } = JSON.parse(raw);
        if (Date.now() - at < 7 * 864e5) trackEvent('landing_cta_signed_in', { where });
    } catch { /* ignore */ }
};
