'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Droplets, Loader2, AlertTriangle, TrendingDown, Activity, LineChart as LineChartIcon } from 'lucide-react';
import {
    ComposedChart, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend, ZAxis, Area, AreaChart
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import api, { getApiErrorMessage } from '@/lib/axios';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
];

interface ChartPoint {
    date: string;
    rainfall: number;
    waterLevel: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl z-50 relative">
            <p className="text-slate-400 mb-2">{label ? (label.includes('-') ? new Date(label).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : label) : 'Data Point'}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
                    {p.name}: {p.value?.toFixed(2)} {p.name.includes('Rainfall') ? 'mm' : 'm'}
                </p>
            ))}
        </div>
    );
};

export default function RainfallPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [scatterData, setScatterData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [correlation, setCorrelation] = useState<number | null>(null);

    const loadData = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: '500', sort: 'date:1' };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;

            // Using mock API to guarantee 500+ records with integrated rainfall
            const res = await api.get('/mock/groundwater', { params });
            const gwData = res.data.data ?? [];

            const byMonth: Record<string, { rain: number; wl: number[]; count: number }> = {};

            gwData.forEach((r: any) => {
                const m = r.date?.split('T')[0]?.substring(0, 7);
                if (!m) return;
                if (!byMonth[m]) byMonth[m] = { rain: 0, wl: [], count: 0 };
                // Sum avg rainfall for the month across stations
                if (r.rainfall) {
                    byMonth[m].rain += r.rainfall;
                    byMonth[m].count++;
                }
                if (r.waterLevelMbgl != null) {
                    byMonth[m].wl.push(r.waterLevelMbgl);
                }
            });

            const pts: ChartPoint[] = Object.entries(byMonth)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([m, v]) => ({
                    date: `${m}-01`,
                    // average rainfall across the reporting stations
                    rainfall: v.count ? +(v.rain / v.count).toFixed(1) : 0,
                    waterLevel: v.wl.length ? +(v.wl.reduce((a, b) => a + b, 0) / v.wl.length).toFixed(2) : null,
                }));

            setChartData(pts);

            // Generate Scatter Data (Rainfall vs Water Level)
            const sData = pts.filter(p => p.waterLevel != null && p.rainfall > 0).map(p => ({
                x: p.rainfall,
                y: p.waterLevel,
                z: 100 // Dot size
            }));
            setScatterData(sData);

            // Pearson Correlation Calculation
            if (sData.length > 2) {
                const n = sData.length;
                const xs = sData.map(p => p.x);
                const ys = sData.map(p => p.y!);
                const mx = xs.reduce((a, b) => a + b) / n;
                const my = ys.reduce((a, b) => a + b) / n;
                const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
                const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
                setCorrelation(den > 0 ? +(num / den).toFixed(3) : null);
            }
        } catch (err) {
            setError(getApiErrorMessage(err) || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(filters); }, [loadData, filters]);

    const corrLabel = correlation != null
        ? (correlation < -0.5 ? 'Strong Negative (Rain reduces depth)' : correlation < -0.2 ? 'Moderate Negative' : correlation > 0.5 ? 'Strong Positive (Unusual)' : 'Weak / No Correlation')
        : 'Calculating...';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <CloudRain className="w-6 h-6 text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Rainfall Analysis</h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Analyze the impact of precipitation on groundwater levels
                    </p>
                </div>
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

            {/* Top Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20" />
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Correlation</p>
                    <p className="text-3xl font-bold text-white tabular-nums">{correlation?.toFixed(2) ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-1">{corrLabel}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-20" />
                    <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Avg Monthly Rain</p>
                    <p className="text-3xl font-bold text-white tabular-nums">
                        {chartData.length ? +(chartData.reduce((a, b) => a + b.rainfall, 0) / chartData.length).toFixed(1) : 0} mm
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Over {chartData.length} months</p>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500 rounded-full blur-2xl opacity-20" />
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Highest Rainfall</p>
                    <p className="text-3xl font-bold text-white tabular-nums">
                        {chartData.length ? Math.max(...chartData.map(d => d.rainfall)).toFixed(1) : 0} mm
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Peak monsoon detection</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* 1. Monthly Rainfall Chart (Bar) */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-white">Monthly Rainfall Distribution</h2>
                        {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
                    </div>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { year: '2-digit', month: 'short' })} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="rainfall" fill="#3b82f6" name="Rainfall" radius={[4, 4, 0, 0]} animationDuration={2000} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500">No data available</div>}
                </div>

                {/* 2. Rainfall vs Groundwater Correlation (Scatter) */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Rainfall vs Depth Correlation</h2>
                    {scatterData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="x" name="Rainfall" tick={{ fontSize: 10, fill: '#64748b' }} unit="cm" />
                                <YAxis type="number" dataKey="y" name="GW Depth" tick={{ fontSize: 10, fill: '#64748b' }} reversed unit="m" />
                                <ZAxis type="number" range={[40, 100]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                                <Scatter name="Impact Point" data={scatterData} fill="#0ea5e9" opacity={0.6} animationDuration={2000} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[300px] flex items-center justify-center text-slate-500">No scatter data</div>}
                </div>

                {/* 3. Rainfall Trend Line (Area) */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 lg:col-span-2">
                    <h2 className="font-semibold text-white mb-4">Precipitation Trend Overview</h2>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { year: '2-digit', month: 'short' })} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="rainfall" stroke="#8b5cf6" strokeWidth={2} fill="url(#rainGrad)" name="Recorded Rainfall" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[250px] flex items-center justify-center text-slate-500">No trend data</div>}
                </div>
            </div>

            {/* Insight Note */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                    <strong>Analytical Insight:</strong> The Pearson correlation coefficient measures the linear relationship between rainfall (x-axis) and groundwater depth (y-axis). A strong negative value indicates that higher rainfall robustly correlates with a decrease in depth (which means a rise in water level).
                </p>
            </div>
        </div>
    );
}
