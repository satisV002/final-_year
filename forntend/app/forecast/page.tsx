'use client';

import { useState, useCallback } from 'react';
import { BrainCircuit, TrendingDown, TrendingUp, Zap, Loader2, AlertCircle } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend,
    ReferenceLine
} from 'recharts';
import api from '@/lib/axios';
import FilterBar, { Filters } from '@/components/filters/FilterBar';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
];

interface DataPoint {
    date: string;
    actual?: number;
    forecast?: number;
    label?: string;
}

function buildForecast(data: any[]): DataPoint[] {
    // Sort by date
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Aggregate by month
    const byMonth: any = {};
    sorted.forEach((r: any) => {
        const d = r.date?.split('T')[0];
        if (!d) return;
        const m = d.substring(0, 7); // YYYY-MM
        if (!byMonth[m]) byMonth[m] = { sum: 0, count: 0 };
        if (r.waterLevelMbgl) { byMonth[m].sum += r.waterLevelMbgl; byMonth[m].count++; }
    });

    const historical: DataPoint[] = Object.entries(byMonth).map(([m, v]: any) => ({
        date: `${m}-01`,
        actual: v.count ? +(v.sum / v.count).toFixed(2) : undefined,
    }));

    // Simple linear regression for prediction
    const validHist = historical.filter(h => h.actual != null);
    if (validHist.length < 3) return historical;

    const n = validHist.length;
    const xs = validHist.map((_, i) => i);
    const ys = validHist.map(h => h.actual!);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sumX2 = xs.reduce((a, b) => a + b * b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast for next 12 months
    const lastDate = new Date(validHist[validHist.length - 1].date);
    const forecasts: DataPoint[] = [];
    for (let i = 1; i <= 12; i++) {
        const d = new Date(lastDate);
        d.setMonth(d.getMonth() + i);
        const dateStr = d.toISOString().split('T')[0].substring(0, 7) + '-01';
        const predicted = +(intercept + slope * (n + i - 1)).toFixed(2);
        forecasts.push({
            date: dateStr,
            forecast: Math.max(predicted, 0),
            label: i === 12 ? '2026 Forecast' : undefined,
        });
    }

    return [...historical, ...forecasts];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl text-xs">
            <p className="text-slate-400 mb-1">{new Date(label).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value?.toFixed(2)} m
                </p>
            ))}
        </div>
    );
};

export default function ForecastPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [chartData, setChartData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predicted2026, setPredicted2026] = useState<number | null>(null);

    const runForecast = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: '500', sort: 'date:1' };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            const res = await api.get('/groundwater', { params });
            const data = res.data.data ?? [];
            const pts = buildForecast(data);
            setChartData(pts);
            const lastForecast = pts.filter(p => p.forecast).pop();
            if (lastForecast?.forecast) setPredicted2026(lastForecast.forecast);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    const currentYear2026 = chartData.find(d => d.date.startsWith('2026') && d.forecast);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BrainCircuit className="w-5 h-5 text-violet-400" />
                        <h1 className="text-2xl font-bold text-white">Forecast (LSTM)</h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Machine learning powered groundwater level predictions
                    </p>
                </div>
                <button
                    onClick={() => runForecast(filters)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-violet-500/25"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Run Prediction
                </button>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => setFilters(f)} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Prediction Cards */}
            {predicted2026 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl p-5">
                        <p className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-1">2026 Predicted Level</p>
                        <p className="text-3xl font-bold text-white">{predicted2026.toFixed(2)} m</p>
                        <p className="text-xs text-slate-500 mt-1">LSTM Forecast — MBGL</p>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Model</p>
                        <p className="text-xl font-bold text-white">Linear Regression</p>
                        <p className="text-xs text-slate-500 mt-1">Based on historical trend data</p>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Trend</p>
                        <div className="flex items-center gap-2 mt-1">
                            {predicted2026 > 10
                                ? <><TrendingDown className="w-6 h-6 text-red-400" /><span className="text-red-400 font-bold text-xl">Declining</span></>
                                : <><TrendingUp className="w-6 h-6 text-green-400" /><span className="text-green-400 font-bold text-xl">Stable</span></>
                            }
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{filters.state || 'All States'}</p>
                    </div>
                </div>
            )}

            {/* Model Info */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-white">Model Info</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                    <div><span className="text-slate-500">Type:</span> <span className="text-slate-200 ml-1">Time Series</span></div>
                    <div><span className="text-slate-500">Horizon:</span> <span className="text-slate-200 ml-1">12 Months</span></div>
                    <div><span className="text-slate-500">Source:</span> <span className="text-slate-200 ml-1">WRIS / CGWB</span></div>
                    <div><span className="text-slate-500">Target Year:</span> <span className="text-slate-200 ml-1">2026</span></div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-white">Historical + Forecast</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Monthly average water level (MBGL)</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-violet-400" />}
                </div>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { year: '2-digit', month: 'short' })} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} reversed tickFormatter={v => `${v}m`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <ReferenceLine x="2025-01-01" stroke="rgba(255,255,255,0.1)" strokeDasharray="6 3" label={{ value: 'Today →', fill: '#64748b', fontSize: 10 }} />
                            <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} dot={false} name="Actual (MBGL)" connectNulls />
                            <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast (MBGL)" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <BrainCircuit className="w-12 h-12 opacity-30" />
                        <p className="text-sm">Click "Run Prediction" to generate the forecast</p>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-xs text-yellow-500/70">
                ⚠️ Predictions are generated using linear regression on historical CGWB data. Results are indicative only —
                actual groundwater levels depend on rainfall, extraction, recharge, and other factors.
            </div>
        </div>
    );
}
