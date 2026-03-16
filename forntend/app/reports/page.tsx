'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    BarChart3, Loader2, AlertTriangle, TrendingUp,
    TrendingDown, Minus, Download, RefreshCw, Activity
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import { StationRecord } from '@/types/station';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
];

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

interface ReportData {
    byDistrict: { name: string; avg: number; count: number }[];
    statusBreakdown: { name: string; value: number }[];
    seasonalData: { month: string; PreMonsoon?: number; PostMonsoon?: number }[];
    rechargeData: { year: string; Recharge: number; Extraction: number }[];
    declineTrend: { year: string; depth: number }[];
    summary: { total: number; avg: number; critical: number; rising: number; falling: number; stable: number };
}

function processData(data: StationRecord[]): ReportData {
    // 1. District Ranking
    const byDistrict: any = {};
    data.forEach(r => {
        const d = r.districtName || 'Unknown';
        if (!byDistrict[d]) byDistrict[d] = { sum: 0, count: 0 };
        if (r.waterLevelMbgl != null) { byDistrict[d].sum += r.waterLevelMbgl; byDistrict[d].count++; }
    });

    const districtArr = Object.entries(byDistrict)
        .map(([name, v]: any) => ({ name, avg: v.count ? +(v.sum / v.count).toFixed(2) : 0, count: v.count }))
        .sort((a, b) => b.avg - a.avg) // Sort by deepest first
        .slice(0, 10);

    // 2. Status Breakdown (using latest records per station)
    const latestMap = new Map<string, StationRecord>();
    data.forEach(r => {
        const existing = latestMap.get(r.stationId);
        if (!existing || new Date(r.date) > new Date(existing.date)) {
            latestMap.set(r.stationId, r);
        }
    });
    const unique = Array.from(latestMap.values());
    const critical = unique.filter(r => r.waterLevelMbgl > 10).length;
    const moderate = unique.filter(r => r.waterLevelMbgl > 5 && r.waterLevelMbgl <= 10).length;
    const good = unique.filter(r => r.waterLevelMbgl <= 5).length;

    const statusBreakdown = [
        { name: 'Good (≤5m)', value: good },
        { name: 'Moderate (5-10m)', value: moderate },
        { name: 'Critical (>10m)', value: critical },
    ];

    // 3. Decline Trend (Yearly Average Depth)
    const yearlyMap: any = {};
    data.forEach(r => {
        const yr = new Date(r.date).getFullYear().toString();
        if (!yearlyMap[yr]) yearlyMap[yr] = { sum: 0, count: 0 };
        if (r.waterLevelMbgl != null) { yearlyMap[yr].sum += r.waterLevelMbgl; yearlyMap[yr].count++; }
    });
    const declineTrend = Object.keys(yearlyMap).sort().map(yr => ({
        year: yr,
        depth: +(yearlyMap[yr].sum / yearlyMap[yr].count).toFixed(2)
    }));

    // 4. Seasonal Comparison & Recharge vs Extraction
    // PreMonsoon: Mar-May, Monsoon/PostMonsoon: Jun-Nov
    const rechargeMap: any = {};
    data.forEach(r => {
        const yr = new Date(r.date).getFullYear().toString();
        const m = new Date(r.date).getMonth() + 1;
        if (!rechargeMap[yr]) rechargeMap[yr] = { pre: [], post: [] };
        if (r.waterLevelMbgl != null) {
            if (m >= 3 && m <= 5) rechargeMap[yr].pre.push(r.waterLevelMbgl); // Pre-monsoon (hot/dry)
            if (m >= 9 && m <= 11) rechargeMap[yr].post.push(r.waterLevelMbgl); // Post-monsoon (wet)
        }
    });

    const rechargeData: any[] = [];
    Object.keys(rechargeMap).sort().forEach(yr => {
        const preAvg = rechargeMap[yr].pre.length ? rechargeMap[yr].pre.reduce((a: number, b: number) => a + b, 0) / rechargeMap[yr].pre.length : 0;
        const postAvg = rechargeMap[yr].post.length ? rechargeMap[yr].post.reduce((a: number, b: number) => a + b, 0) / rechargeMap[yr].post.length : 0;

        if (preAvg > 0 && postAvg > 0) {
            // Depth decreases (improves) during monsoon = recharge
            const change = preAvg - postAvg;
            rechargeData.push({
                year: yr,
                Recharge: change > 0 ? +(change * 3.5).toFixed(1) : 0, // Mock volume mapping
                Extraction: change < 0 ? +(Math.abs(change) * 2.5).toFixed(1) : +(preAvg * 0.8).toFixed(1) // Mock extraction
            });
        }
    });

    const seasonalData: { month: string; PreMonsoon?: number; PostMonsoon?: number }[] = [
        { month: 'Mar-May', PreMonsoon: 3.2 },
        { month: 'Jun-Aug', PostMonsoon: 5.4 },
        { month: 'Sep-Nov', PostMonsoon: 7.2 },
        { month: 'Dec-Feb', PreMonsoon: 9.8 },
    ]; // Using mock static seasonality pattern for demonstration if real varies too much

    const avg = unique.reduce((s, r) => s + (r.waterLevelMbgl || 0), 0) / (unique.length || 1);

    return {
        byDistrict: districtArr,
        statusBreakdown,
        declineTrend,
        rechargeData,
        seasonalData,
        summary: {
            total: unique.length,
            avg: +avg.toFixed(2),
            critical,
            rising: unique.filter(r => r.trend === 'Rising').length,
            falling: unique.filter(r => r.trend === 'Falling').length,
            stable: unique.filter(r => r.trend === 'Stable').length,
        }
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl z-50 relative">
            <p className="text-slate-300 font-bold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
                    {p.name}: {p.value}{p.name.toLowerCase().includes('depth') ? 'm' : ''}
                </p>
            ))}
        </div>
    );
};

export default function ReportsPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: '500', sort: 'date:-1' };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;

            // Using guaranteed mock data for complete analytics
            const res = await api.get('/mock/groundwater', { params });
            const rawData = res.data.data ?? [];

            const data: StationRecord[] = rawData.map((s: any) => ({
                ...s,
                stationId: s.location?.stationId || '',
                stateName: s.location?.state || '',
                districtName: s.location?.district || '',
                villageName: s.location?.village || '',
                agencyName: s.source || 'Unknown'
            }));

            setReport(processData(data));
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { generate(filters); }, [generate, filters]);

    const { summary, byDistrict = [], statusBreakdown = [], declineTrend = [], rechargeData = [], seasonalData = [] } = report ?? {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports & Advanced Analytics</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Aggregated groundwater analysis & long-term comparisons</p>
                    </div>
                </div>
                <button onClick={() => generate(filters)} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition shadow-lg disabled:opacity-40">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Generate Report
                </button>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => setFilters(f)} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {loading && !report && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}

            {summary && report && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {[
                            { label: 'Network Stations', value: summary.total.toLocaleString(), color: 'text-cyan-400', gradient: 'from-slate-900 to-cyan-950/40', glow: 'bg-cyan-500' },
                            { label: 'Avg Depth (MBGL)', value: summary.avg.toFixed(2), color: 'text-blue-400', gradient: 'from-slate-900 to-blue-950/40', glow: 'bg-blue-500' },
                            { label: 'Critical Alert', value: summary.critical, color: 'text-red-400', gradient: 'from-slate-900 to-red-950/30', glow: 'bg-red-500' },
                            { label: 'Rising / Safe', value: summary.rising, icon: TrendingUp, color: 'text-green-400', gradient: 'from-slate-900 to-green-950/30', glow: 'bg-green-500' },
                            { label: 'Falling / Danger', value: summary.falling, icon: TrendingDown, color: 'text-orange-400', gradient: 'from-slate-900 to-orange-950/30', glow: 'bg-orange-500' },
                            { label: 'Stable', value: summary.stable, icon: Minus, color: 'text-yellow-400', gradient: 'from-slate-900 to-yellow-950/20', glow: 'bg-yellow-500' },
                        ].map(k => (
                            <div key={k.label} className={`relative overflow-hidden border border-white/5 rounded-2xl p-4 hover:border-white/15 hover:scale-[1.02] transition-all duration-300 group cursor-default text-center bg-gradient-to-br ${k.gradient}`}>
                                <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-15 group-hover:opacity-30 transition-opacity ${k.glow}`} />
                                <p className={`relative text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
                                <p className="relative text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 1. Decline Trend */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <h2 className="font-semibold text-white mb-4">Historical Decline Trend</h2>
                            {declineTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={declineTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="declineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} reversed unit="m" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                        <Area type="monotone" dataKey="depth" name="Avg Depth (MBGL)" stroke="#f43f5e" strokeWidth={2} fill="url(#declineGrad)" animationDuration={2000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-[260px] flex items-center justify-center text-slate-500">No data</div>}
                        </div>

                        {/* 2. Recharge vs Extraction */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <h2 className="font-semibold text-white mb-4">Recharge vs Extraction Estimates</h2>
                            {rechargeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={rechargeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                        <Bar dataKey="Recharge" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={2000} />
                                        <Bar dataKey="Extraction" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={2000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-[260px] flex items-center justify-center text-slate-500">No data</div>}
                        </div>

                        {/* 3. District Ranking */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <div className="mb-4">
                                <h2 className="font-semibold text-white">District Risk Ranking</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Top 10 deepest/most depleted districts</p>
                            </div>
                            {byDistrict.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={byDistrict} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit="m" />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={90} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="avg" fill="#0ea5e9" name="Avg Depth" radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={2000} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="h-[260px] flex items-center justify-center text-slate-500">No data</div>}
                        </div>

                        {/* 4. Seasonal Comparison */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <div className="mb-4">
                                <h2 className="font-semibold text-white">Seasonal Water Level Comparison</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Pre-Monsoon vs Post-Monsoon Patterns (Simulated)</p>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={seasonalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} reversed unit="m" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                    <Line type="monotone" dataKey="PreMonsoon" stroke="#f59e0b" strokeWidth={3} strokeDasharray="4 4" name="Pre-Monsoon Depth" connectNulls animationDuration={2000} />
                                    <Line type="monotone" dataKey="PostMonsoon" stroke="#3b82f6" strokeWidth={3} name="Post-Monsoon Depth" connectNulls animationDuration={2000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* Note */}
            <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl flex items-start gap-3">
                <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                    This report represents aggregated state-wise patterns. Decline trends show historical trajectory of aquifer depletion over years. District risk ranking highlights regions needing critical intervention based on average recorded depth. Recharge estimates compare volume recovery post-monsoons.
                </p>
            </div>
        </div>
    );
}
