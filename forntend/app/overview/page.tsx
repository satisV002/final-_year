'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import {
    Waves, AlertTriangle, TrendingDown, TrendingUp,
    MapPin, BrainCircuit, Droplets, ArrowRight, Activity,
    BarChart3, RadioTower
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';

interface OverviewStats {
    total: number;
    avgDepth: number;
    critical: number;
    declining: number;
}

const QUICK_LINKS = [
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard', desc: 'Trends & Analysis', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20 hover:border-cyan-500/40' },
    { href: '/forecast', icon: BrainCircuit, label: 'Forecast (LSTM)', desc: 'ML Predictions 2026', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/20 hover:border-violet-500/40' },
    { href: '/stations', icon: RadioTower, label: 'Stations', desc: 'All DWLR Stations', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 hover:border-emerald-500/40' },
    { href: '/map', icon: MapPin, label: 'Map View', desc: 'Geospatial Data', color: 'from-orange-500/20 to-red-500/20 border-orange-500/20 hover:border-orange-500/40' },
];

export default function OverviewPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await api.get('/groundwater', { params: { state: 'Telangana', limit: '100', sort: 'date:1' } });
            const data = res.data.data ?? [];
            const total = data.length;
            const avgDepth = data.length ? data.reduce((s: number, r: any) => s + (r.waterLevelMbgl || 0), 0) / data.length : 0;
            const critical = data.filter((r: any) => r.waterLevelMbgl > 10).length;
            const declining = data.filter((r: any) => r.trend === 'Falling').length;
            setStats({ total, avgDepth, critical, declining });

            // Build simple chart
            const byDate: any = {};
            data.forEach((r: any) => {
                const d = r.date?.split('T')[0];
                if (!d) return;
                if (!byDate[d]) byDate[d] = { date: d, sum: 0, count: 0 };
                if (r.waterLevelMbgl) { byDate[d].sum += r.waterLevelMbgl; byDate[d].count++; }
            });
            setChartData(
                Object.values(byDate)
                    .map((v: any) => ({ date: v.date, avg: v.count ? +(v.sum / v.count).toFixed(2) : null }))
                    .slice(-30)
            );
        } catch { /* silently fail */ }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-slate-900 border border-cyan-500/15 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full">
                            Real-time Monitoring Active
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
                        Sustainable Groundwater<br />
                        <span className="text-cyan-400">Management System</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-lg">
                        Advanced monitoring and AI-driven prediction for India's groundwater network.
                        Empowering researchers and policymakers with actionable insights.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-5">
                        <Link href="/dashboard"
                            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-cyan-500/25">
                            Open Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/forecast"
                            className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold rounded-xl hover:bg-white/10 transition">
                            View Predictions
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Stations', value: stats.total.toLocaleString(), icon: MapPin, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'Avg. Water Level', value: `${stats.avgDepth.toFixed(1)} m`, icon: Waves, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Critical Alerts', value: stats.critical.toLocaleString(), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                        { label: 'Declining Levels', value: stats.declining.toLocaleString(), icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart + Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-1">Average Water Level Trend</h2>
                    <p className="text-xs text-slate-500 mb-4">Last 30 days — Telangana (MBGL)</p>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }}
                                    tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} reversed tickFormatter={v => `${v}m`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12 }}
                                    formatter={(v: any) => [`${v} m`, 'Avg Level']}
                                    labelFormatter={l => new Date(l).toLocaleDateString('en-IN')}
                                />
                                <Area type="monotone" dataKey="avg" stroke="#06b6d4" fill="url(#overviewGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
                            <Activity className="w-5 h-5 mr-2 animate-pulse" /> Loading trend data...
                        </div>
                    )}
                </div>

                {/* Quick Navigation */}
                <div className="space-y-3">
                    <h2 className="font-semibold text-white px-1">Quick Access</h2>
                    {QUICK_LINKS.map(l => (
                        <Link key={l.href} href={l.href}
                            className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${l.color} border transition-all group`}>
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                <l.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{l.label}</p>
                                <p className="text-xs text-slate-400">{l.desc}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
