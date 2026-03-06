'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    BarChart3, Loader2, AlertTriangle, TrendingUp,
    TrendingDown, Minus, Download, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import { StationRecord } from '@/types/station';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
];

const PIE_COLORS = ['#22c55e', '#f97316', '#ef4444'];

interface ReportData {
    byDistrict: { name: string; avg: number; count: number }[];
    statusBreakdown: { name: string; value: number }[];
    summary: { total: number; avg: number; critical: number; rising: number; falling: number; stable: number };
}

function processData(data: StationRecord[]): ReportData {
    const byDistrict: any = {};
    data.forEach(r => {
        const d = r.districtName;
        if (!byDistrict[d]) byDistrict[d] = { sum: 0, count: 0 };
        if (r.waterLevelMbgl != null) { byDistrict[d].sum += r.waterLevelMbgl; byDistrict[d].count++; }
    });

    const districtArr = Object.entries(byDistrict)
        .map(([name, v]: any) => ({ name, avg: v.count ? +(v.sum / v.count).toFixed(2) : 0, count: v.count }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10);

    const critical = data.filter(r => r.waterLevelMbgl > 10).length;
    const moderate = data.filter(r => r.waterLevelMbgl > 5 && r.waterLevelMbgl <= 10).length;
    const good = data.filter(r => r.waterLevelMbgl <= 5).length;

    const statusBreakdown = [
        { name: 'Good (≤5m)', value: good },
        { name: 'Moderate (5-10m)', value: moderate },
        { name: 'Critical (>10m)', value: critical },
    ];

    const validLevels = data.filter(r => r.waterLevelMbgl != null);
    const avg = validLevels.length ? validLevels.reduce((s, r) => s + r.waterLevelMbgl, 0) / validLevels.length : 0;

    return {
        byDistrict: districtArr,
        statusBreakdown,
        summary: {
            total: data.length,
            avg: +avg.toFixed(2),
            critical,
            rising: data.filter(r => r.trend === 'Rising').length,
            falling: data.filter(r => r.trend === 'Falling').length,
            stable: data.filter(r => r.trend === 'Stable').length,
        }
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-slate-300 font-medium mb-1">{label}</p>
            <p className="text-cyan-400">{payload[0]?.value?.toFixed(2)} m avg</p>
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
            if (f.fromDate) params.fromDate = f.fromDate;
            if (f.toDate) params.toDate = f.toDate;
            const res = await api.get('/groundwater', { params });
            const rawData = res.data.data ?? [];

            const data: StationRecord[] = rawData.map((s: any) => ({
                ...s,
                stationId: s.location?.stationId || '',
                stateName: s.location?.state || '',
                districtName: s.location?.district || '',
                villageName: s.location?.village || '',
                lat: s.location?.coordinates?.coordinates?.[1] || 0,
                lng: s.location?.coordinates?.coordinates?.[0] || 0,
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

    const { summary, byDistrict, statusBreakdown } = report ?? {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Aggregated groundwater analysis</p>
                    </div>
                </div>
                <button onClick={() => generate(filters)} disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition disabled:opacity-40">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
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
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            )}

            {summary && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {[
                            { label: 'Total Records', value: summary.total.toLocaleString(), color: 'text-cyan-400', gradient: 'from-slate-900 to-cyan-950/40', glow: 'bg-cyan-500' },
                            { label: 'Avg Depth (m)', value: summary.avg.toFixed(2), color: 'text-blue-400', gradient: 'from-slate-900 to-blue-950/40', glow: 'bg-blue-500' },
                            { label: 'Critical', value: summary.critical, color: 'text-red-400', gradient: 'from-slate-900 to-red-950/30', glow: 'bg-red-500' },
                            { label: 'Rising', value: summary.rising, icon: TrendingUp, color: 'text-green-400', gradient: 'from-slate-900 to-green-950/30', glow: 'bg-green-500' },
                            { label: 'Falling', value: summary.falling, icon: TrendingDown, color: 'text-orange-400', gradient: 'from-slate-900 to-orange-950/30', glow: 'bg-orange-500' },
                            { label: 'Stable', value: summary.stable, icon: Minus, color: 'text-yellow-400', gradient: 'from-slate-900 to-yellow-950/20', glow: 'bg-yellow-500' },
                        ].map(k => (
                            <div key={k.label} className={`relative overflow-hidden border border-white/5 rounded-2xl p-4 hover:border-white/15 hover:scale-[1.02] transition-all duration-300 group cursor-default text-center bg-gradient-to-br ${k.gradient}`}>
                                <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-15 group-hover:opacity-30 transition-opacity ${k.glow}`} />
                                <p className={`relative text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
                                <p className="relative text-xs text-slate-500 mt-1">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Bar chart - top districts */}
                        <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <div className="mb-4">
                                <h2 className="font-semibold text-white">Top Districts by Avg Water Depth</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Average MBGL — higher = deeper / more depleted</p>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={byDistrict} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v}m`} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={90} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="avg" fill="#06b6d4" radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie - status breakdown */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                            <h2 className="font-semibold text-white mb-1">Station Status</h2>
                            <p className="text-xs text-slate-500 mb-4">By water level category</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusBreakdown} cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={3} dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {statusBreakdown?.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 12 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Insight Text */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                        <h2 className="font-semibold text-white mb-3">Analysis Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                            <p>
                                📊 Analyzed <span className="text-white font-medium">{summary.total}</span> records from{' '}
                                <span className="text-white font-medium">{filters.state || 'all states'}</span>.
                                Average groundwater depth is <span className="text-cyan-400 font-medium">{summary.avg.toFixed(2)} m MBGL</span>.
                            </p>
                            <p>
                                ⚠️ <span className="text-red-400 font-medium">{summary.critical}</span> stations have critical levels (&gt;10 m MBGL).
                                Trend distribution: <span className="text-green-400">{summary.rising} rising</span>,{' '}
                                <span className="text-orange-400">{summary.falling} falling</span>,{' '}
                                <span className="text-yellow-400">{summary.stable} stable</span>.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
