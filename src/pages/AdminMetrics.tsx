
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ConflictLog, AnalyticsEvent } from '../types';
import { isAdmin } from '../services/admin';
import { ArrowLeft, Loader2, TrendingUp, Users, MessageSquare, ShieldAlert, Activity, Clock, Calendar, BarChart3 } from 'lucide-react';

interface AdminMetricsProps {
    onBack: () => void;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    
    // Calculated Metrics
    const [dau, setDau] = useState(0);
    const [avgDaysActive, setAvgDaysActive] = useState(0);
    const [topFeatures, setTopFeatures] = useState<{name: string, count: number}[]>([]);
    const [leastFeatures, setLeastFeatures] = useState<{name: string, count: number}[]>([]);
    const [heatmap, setHeatmap] = useState<number[]>(new Array(24).fill(0));
    const [avgEntriesPerWeek, setAvgEntriesPerWeek] = useState(0);

    useEffect(() => {
        const fetchMetrics = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!isAdmin(user?.id)) {
                setLoading(false);
                return;
            }

            // Fetch Analytics Events (Last 30 days limit)
            const { data: analyticsData } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });

            // Fetch Journal Entries for specific calc
            const { data: journalData } = await supabase
                .from('journal_entries')
                .select('id, user_id, created_at');

            if (analyticsData) {
                // @ts-ignore
                setEvents(analyticsData);
                processAnalytics(analyticsData, journalData || []);
            }
            setLoading(false);
        };

        fetchMetrics();
    }, []);

    const processAnalytics = (events: AnalyticsEvent[], entries: any[]) => {
        // 1. DAU (Unique users in last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeToday = new Set(events.filter(e => new Date(e.created_at) > oneDayAgo).map(e => e.user_id));
        setDau(activeToday.size);

        // 2. Active Days Per Week (Retention)
        const userActivityMap = new Map<string, Set<string>>(); // UserId -> Set of "YYYY-MM-DD"
        events.forEach(e => {
            const date = new Date(e.created_at).toDateString();
            if (!userActivityMap.has(e.user_id)) userActivityMap.set(e.user_id, new Set());
            userActivityMap.get(e.user_id)?.add(date);
        });
        
        let totalActiveDays = 0;
        userActivityMap.forEach(days => totalActiveDays += days.size);
        // Approx average over the window (simplification for dashboard)
        const avgDays = userActivityMap.size > 0 ? (totalActiveDays / userActivityMap.size) : 0;
        setAvgDaysActive(parseFloat(avgDays.toFixed(1)));

        // 3. Heatmap (Hour of Day)
        const hours = new Array(24).fill(0);
        events.forEach(e => {
            const h = new Date(e.created_at).getHours();
            hours[h]++;
        });
        setHeatmap(hours);

        // 4. Feature Usage
        const featureCounts: Record<string, number> = {};
        events.forEach(e => {
            featureCounts[e.event_name] = (featureCounts[e.event_name] || 0) + 1;
        });
        
        const sortedFeatures = Object.entries(featureCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        setTopFeatures(sortedFeatures.slice(0, 5));
        setLeastFeatures(sortedFeatures.slice(-3).reverse());

        // 5. Avg Entries Per Week Per User (Proxy for "Couple" in this view)
        if (entries.length > 0) {
            const uniqueEntryUsers = new Set(entries.map(e => e.user_id)).size;
            // Assuming data is roughly 30 days (4 weeks)
            const entriesPerUser = entries.length / (uniqueEntryUsers || 1);
            setAvgEntriesPerWeek(parseFloat((entriesPerUser / 4).toFixed(1)));
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto animate-fade-in font-sans text-slate-900">
            <div className="max-w-7xl mx-auto p-6 md:p-12">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Exit Admin
                </button>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-serif font-bold mb-2">Pulse Dashboard</h1>
                        <p className="text-slate-500">Real-time product telemetry and user behavior.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Live
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Users size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">DAU (24h)</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{dau}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Calendar size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Active Days/User</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{avgDaysActive}</div>
                        <div className="text-xs text-slate-400 mt-2 font-medium">Last 30 Days</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <MessageSquare size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Entries/Week</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{avgEntriesPerWeek}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Activity size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Total Events</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{events.length}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Feature Usage Rankings */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-slate-400" /> Feature Usage
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Most Used</p>
                                <div className="space-y-3">
                                    {topFeatures.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-700">{f.name.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-3 w-1/2">
                                                <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${(f.count / (topFeatures[0]?.count || 1)) * 100}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold tabular-nums w-8 text-right">{f.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3">Least Used</p>
                                <div className="space-y-2">
                                    {leastFeatures.map((f, i) => (
                                        <div key={i} className="flex justify-between text-sm text-slate-500">
                                            <span>{f.name.replace(/_/g, ' ')}</span>
                                            <span className="font-mono text-xs">{f.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Heatmap */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" /> Activity Heatmap (UTC)
                        </h3>
                        <div className="flex items-end gap-1 h-48">
                            {heatmap.map((count, hour) => {
                                const max = Math.max(...heatmap) || 1;
                                const height = (count / max) * 100;
                                return (
                                    <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div 
                                            className="w-full bg-[#f0addd] rounded-t-sm transition-all hover:bg-slate-900 relative"
                                            style={{ height: `${Math.max(height, 5)}%`, opacity: 0.3 + (height/150) }}
                                        >
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                                {count} events at {hour}:00
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                            <span>12 AM</span>
                            <span>6 AM</span>
                            <span>12 PM</span>
                            <span>6 PM</span>
                            <span>11 PM</span>
                        </div>
                    </div>
                </div>

                {/* Raw Stream */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50">
                        <h3 className="font-bold text-lg">Live Event Stream</h3>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Event Name</th>
                                    <th className="px-6 py-4">User ID</th>
                                    <th className="px-6 py-4">Properties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {events.slice(0, 50).map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3 text-slate-400 whitespace-nowrap text-xs">
                                            {new Date(e.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-slate-700">
                                            {e.event_name}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-slate-400">
                                            {e.user_id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500 font-mono max-w-xs truncate">
                                            {JSON.stringify(e.properties)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMetrics;
