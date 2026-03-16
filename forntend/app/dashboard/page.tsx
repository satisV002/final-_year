'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    Activity, TrendingDown, TrendingUp, Minus,
    Waves, AlertTriangle, MapPin, RefreshCw, Loader2
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart, Legend, BarChart, Bar, ComposedChart
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';

import { INDIA_STATES } from '@/lib/constants';
import { StationRecord } from '@/types/station';

interface SummaryStats {
    total: number;
    avgDepth: number;
    critical: number;
    rising: number;
    falling: number;
    stable: number;
}

function StatCard({ title, value, subtitle, icon: Icon, gradient, glow, iconColor }: {
    title: string; value: string | number; subtitle?: string;
    icon: React.ElementType; gradient: string; glow: string; iconColor: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/5 p-5 hover:border-white/15 hover:scale-[1.02] transition-all duration-300 group cursor-default bg-gradient-to-br ${gradient}`}>
            <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${glow}`} />
            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-white mt-1 tabular-nums">{value}</p>
                    {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl text-xs z-50 relative">
                <p className="text-slate-400 mb-1">{label.includes('-') ? new Date(label).toLocaleDateString('en-IN') : label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-medium">
                        {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value} {p.name.includes('Rainfall') ? 'mm' : p.name.includes('Level') ? 'm' : ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [records, setRecords] = useState<StationRecord[]>([]);
    const [stats, setStats] = useState<SummaryStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Chart States
    const [chartData, setChartData] = useState<any[]>([]);
    const [districtData, setDistrictData] = useState<any[]>([]);
    const [distData, setDistData] = useState<any[]>([]);

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
            params.limit = '300';
            params.sort = 'date:1';

            // Pointing to mock data API to guarantee 500+ records for visualizations
            const res = await api.get('/mock/groundwater', { params });
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

            setRecords(data);

            // Compute summary stats
            const validLevels = data.filter(r => r.waterLevelMbgl != null);
            const total = [...new Set(data.map(r => r.stationId))].length;
            const avgDepth = validLevels.length
                ? validLevels.reduce((s, r) => s + r.waterLevelMbgl, 0) / validLevels.length
                : 0;
            const critical = validLevels.filter(r => r.waterLevelMbgl > 10).length;
            const rising = data.filter(r => r.trend === 'Rising').length;
            const falling = data.filter(r => r.trend === 'Falling').length;
            const stable = data.filter(r => r.trend === 'Stable').length;
            setStats({ total, avgDepth, critical, rising, falling, stable });

            // 1. Time Series & Dual Axis Data
            const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const byDate = sorted.reduce((acc: any, r) => {
                const d = r.date.split('T')[0];
                if (!acc[d]) acc[d] = { date: d, levels: [], rainfall: [] };
                if (r.waterLevelMbgl != null) acc[d].levels.push(r.waterLevelMbgl);
                if (r.rainfall != null) acc[d].rainfall.push(r.rainfall);
                return acc;
            }, {});

            const chart = Object.values(byDate).map((v: any) => ({
                date: v.date,
                avgLevel: v.levels.length ? +(v.levels.reduce((s: number, n: number) => s + n, 0) / v.levels.length).toFixed(2) : 0,
                maxLevel: v.levels.length ? +Math.max(...v.levels).toFixed(2) : 0,
                minLevel: v.levels.length ? +Math.min(...v.levels).toFixed(2) : 0,
                avgRainfall: v.rainfall.length ? +(v.rainfall.reduce((s: number, n: number) => s + n, 0) / v.rainfall.length).toFixed(2) : 0,
            }));
            setChartData(chart.slice(-60));

            // 2. Station Count by District
            const uniqueStations = [...new Map(data.map(item => [item.stationId, item])).values()];
            const distCount = uniqueStations.reduce((acc: any, r) => {
                const dist = r.districtName || 'Unknown';
                acc[dist] = (acc[dist] || 0) + 1;
                return acc;
            }, {});
            setDistrictData(Object.entries(distCount).map(([name, count]) => ({ name, count })));

            // 3. Water Level Distribution (Histogram replacement)
            const bins = { '0-5m': 0, '5-10m': 0, '10-15m': 0, '15-20m': 0, '>20m': 0 };
            uniqueStations.forEach(r => {
                const l = r.waterLevelMbgl;
                if (!l) return;
                if (l <= 5) bins['0-5m']++;
                else if (l <= 10) bins['5-10m']++;
                else if (l <= 15) bins['10-15m']++;
                else if (l <= 20) bins['15-20m']++;
                else bins['>20m']++;
            });
            setDistData(Object.entries(bins).map(([range, count]) => ({ range, count })));

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time groundwater monitoring & analytics</p>
                </div>
                <button onClick={() => fetchData(filters)} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition-all disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => setFilters(f)} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <StatCard title="Stations" value={stats.total} subtitle="active points" icon={MapPin} gradient="from-slate-900 to-cyan-950/40" glow="bg-cyan-500" iconColor="text-cyan-400" />
                    <StatCard title="Avg Depth" value={`${stats.avgDepth.toFixed(1)}m`} subtitle="below ground (MBGL)" icon={Waves} gradient="from-slate-900 to-blue-950/40" glow="bg-blue-500" iconColor="text-blue-400" />
                    <StatCard title="Critical" value={stats.critical} subtitle="> 10m MBGL" icon={AlertTriangle} gradient="from-slate-900 to-red-950/30" glow="bg-red-500" iconColor="text-red-400" />
                    <StatCard title="Rising" value={stats.rising} subtitle="improving" icon={TrendingUp} gradient="from-slate-900 to-green-950/30" glow="bg-green-500" iconColor="text-green-400" />
                    <StatCard title="Falling" value={stats.falling} subtitle="depleting" icon={TrendingDown} gradient="from-slate-900 to-orange-950/30" glow="bg-orange-500" iconColor="text-orange-400" />
                    <StatCard title="Stable" value={stats.stable} subtitle="no change" icon={Activity} gradient="from-slate-900 to-purple-950/30" glow="bg-purple-500" iconColor="text-purple-400" />
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
                {/* Chart 1: Water Level Trend */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Groundwater Level Trend</h2>
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
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} reversed />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                <Area type="monotone" dataKey="avgLevel" stroke="#06b6d4" fill="url(#avgGrad)" strokeWidth={2} name="Monthly Avg Level" animationDuration={2000} />
                                <Line type="monotone" dataKey="maxLevel" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Max Level" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>

                {/* Chart 2: Rainfall vs Groundwater */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Rainfall vs Groundwater (Dual Axis)</h2>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={chartData} margin={{ top: 5, right: -10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short' })} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} reversed label={{ value: 'MBGL', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Rain (mm)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                <Bar yAxisId="right" dataKey="avgRainfall" fill="#3b82f6" opacity={0.3} name="Avg Rainfall" radius={[2, 2, 0, 0]} animationDuration={2000} />
                                <Line yAxisId="left" type="monotone" dataKey="avgLevel" stroke="#22c55e" strokeWidth={2} dot={false} name="Groundwater Depth" animationDuration={2000} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>

                {/* Chart 3: Station Count by District */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Station Count by District</h2>
                    {districtData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total Stations" animationDuration={2000} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>

                {/* Chart 4: Water Level Distribution */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Water Level Distribution</h2>
                    {distData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={distData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Station Count" animationDuration={2000} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>
            </div>

        </div>
    );
}
