
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
