'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    Activity, TrendingDown, TrendingUp, Minus,
    Waves, AlertTriangle, MapPin, RefreshCw, Loader2
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
    'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh',
    'Goa', 'Tripura', 'Meghalaya', 'Manipur', 'Nagaland',
    'Arunachal Pradesh', 'Mizoram', 'Sikkim'
];

interface GWRecord {
    _id: string;
    location: { state: string; district?: string; village?: string; stationId?: string; pinCode?: string; };
    date: string;
    waterLevelMbgl: number;
    trend?: string;
    source: string;
}

interface SummaryStats {
    total: number;
    avgDepth: number;
    critical: number;
    rising: number;
    falling: number;
    stable: number;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
    title: string; value: string | number; subtitle?: string;
    icon: React.ElementType; color: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 p-5 hover:border-white/10 transition-all group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl text-xs">
                <p className="text-slate-400 mb-1">{new Date(label).toLocaleDateString('en-IN')}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-medium">
                        {p.name}: {p.value?.toFixed(2)} m
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [records, setRecords] = useState<GWRecord[]>([]);
    const [stats, setStats] = useState<SummaryStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    const fetchData = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            if (f.stationId) params.stationName = f.stationId;
            if (f.fromDate) params.fromDate = f.fromDate;
            if (f.toDate) params.toDate = f.toDate;
            params.limit = '100';
            params.sort = 'date:1';

            const res = await api.get('/groundwater', { params });
            const data: GWRecord[] = res.data.data ?? [];
            setRecords(data);

            // Compute stats
            const validLevels = data.filter(r => r.waterLevelMbgl != null);
            const total = data.length;
            const avgDepth = validLevels.length
                ? validLevels.reduce((s, r) => s + r.waterLevelMbgl, 0) / validLevels.length
                : 0;
            const critical = data.filter(r => r.waterLevelMbgl > 10).length;
            const rising = data.filter(r => r.trend === 'Rising').length;
            const falling = data.filter(r => r.trend === 'Falling').length;
            const stable = data.filter(r => r.trend === 'Stable').length;
            setStats({ total, avgDepth, critical, rising, falling, stable });

            // Build chart data sorted by date
            const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const byDate = sorted.reduce((acc: any, r) => {
                const d = r.date.split('T')[0];
                if (!acc[d]) acc[d] = { date: d, levels: [], count: 0 };
                if (r.waterLevelMbgl != null) { acc[d].levels.push(r.waterLevelMbgl); acc[d].count++; }
                return acc;
            }, {});
            const chart = Object.values(byDate).map((v: any) => ({
                date: v.date,
                avgLevel: v.levels.length ? +(v.levels.reduce((s: number, n: number) => s + n, 0) / v.levels.length).toFixed(2) : null,
                maxLevel: v.levels.length ? +Math.max(...v.levels).toFixed(2) : null,
                minLevel: v.levels.length ? +Math.min(...v.levels).toFixed(2) : null,
            }));
            setChartData(chart.slice(-60)); // last 60 data points
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(filters); }, [fetchData, filters]);

    const trendIcon = (t: string) => t === 'Rising'
        ? <TrendingUp className="w-4 h-4 text-green-400" />
        : t === 'Falling'
            ? <TrendingDown className="w-4 h-4 text-red-400" />
            : <Minus className="w-4 h-4 text-yellow-400" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time groundwater monitoring & analysis</p>
                </div>
                <button onClick={() => fetchData(filters)} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition-all disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => setFilters(f)} />

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <StatCard title="Stations" value={stats.total} subtitle="records found" icon={MapPin} color="bg-cyan-500" />
                    <StatCard title="Avg Depth" value={`${stats.avgDepth.toFixed(1)} m`} subtitle="water level MBGL" icon={Waves} color="bg-blue-500" />
                    <StatCard title="Critical" value={stats.critical} subtitle="> 10 m MBGL" icon={AlertTriangle} color="bg-red-500" />
                    <StatCard title="Rising" value={stats.rising} subtitle="trend" icon={TrendingUp} color="bg-green-500" />
                    <StatCard title="Falling" value={stats.falling} subtitle="trend" icon={TrendingDown} color="bg-orange-500" />
                    <StatCard title="Stable" value={stats.stable} subtitle="trend" icon={Activity} color="bg-purple-500" />
                </div>
            )}

            {/* Chart */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-white">Water Level Trend</h2>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {filters.state || 'All states'} {filters.district ? `/ ${filters.district}` : ''} — MBGL (metres below ground level)
                        </p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />}
                </div>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }}
                                tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}m`} reversed />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="maxLevel" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Max Level" />
                            <Area type="monotone" dataKey="avgLevel" stroke="#06b6d4" fill="url(#avgGrad)" strokeWidth={2} dot={false} name="Avg Level" />
                            <Area type="monotone" dataKey="minLevel" stroke="#22c55e" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Min Level" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : !loading ? (
                    <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                        No chart data for selected filters
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                )}
            </div>

            {/* Recent data table */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Station Records</h2>
                    <span className="text-xs text-slate-500">{records.length} shown</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left">
                                {['Station ID', 'State', 'District', 'Village', 'Date', 'Water Level (m)', 'Trend', 'Source'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.slice(0, 20).map((r) => (
                                <tr key={r._id} className="hover:bg-white/2 transition-colors">
                                    <td className="px-4 py-3 text-xs font-mono text-cyan-400">{r.location.stationId ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.location.state}</td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.location.district ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.location.village ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-mono font-medium ${r.waterLevelMbgl > 10 ? 'text-red-400'
                                                : r.waterLevelMbgl > 5 ? 'text-orange-400'
                                                    : 'text-green-400'
                                            }`}>{r.waterLevelMbgl?.toFixed(2) ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.trend ? <span className="flex items-center gap-1">{trendIcon(r.trend)}<span className="text-slate-400">{r.trend}</span></span> : <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs text-slate-400">{r.source}</span>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && !loading && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No records found — try adjusting filters</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
