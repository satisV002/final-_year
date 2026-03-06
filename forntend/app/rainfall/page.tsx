'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Droplets, Loader2, AlertTriangle, TrendingUp, TrendingDown, Search, Activity } from 'lucide-react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import api, { getApiErrorMessage } from '@/lib/axios';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
];

// State coordinates for Open-Meteo API
const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
    'Telangana': { lat: 17.37, lon: 78.47 },
    'Andhra Pradesh': { lat: 15.92, lon: 79.74 },
    'Karnataka': { lat: 12.97, lon: 77.59 },
    'Maharashtra': { lat: 19.07, lon: 72.87 },
    'Tamil Nadu': { lat: 13.08, lon: 80.27 },
    'Odisha': { lat: 20.29, lon: 85.82 },
    'Rajasthan': { lat: 26.91, lon: 75.78 },
    'Gujarat': { lat: 23.02, lon: 72.57 },
    'Madhya Pradesh': { lat: 23.25, lon: 77.41 },
    'Uttar Pradesh': { lat: 26.84, lon: 80.94 },
};

interface ChartPoint {
    date: string;
    rainfall: number;
    waterLevel: number | null;
}

async function fetchRainfall(state: string): Promise<{ date: string; rainfall: number }[]> {
    const coords = STATE_COORDS[state] || { lat: 20.5937, lon: 78.9629 };
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 90);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=precipitation_sum&start_date=${fmt(start)}&end_date=${fmt(end)}&timezone=Asia%2FKolkata`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.daily?.time ?? []).map((d: string, i: number) => ({
        date: d,
        rainfall: data.daily.precipitation_sum[i] ?? 0,
    }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
            <p className="text-slate-400 mb-2">{new Date(label).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value?.toFixed(2)} {p.name.includes('Rainfall') ? 'mm' : 'm'}
                </p>
            ))}
        </div>
    );
};

// Animated rain drops
function RainBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
            {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-0.5 bg-blue-400 rounded-full"
                    style={{
                        left: `${(i * 2.5) % 100}%`,
                        height: `${8 + (i % 3) * 6}px`,
                        top: '-20px',
                    }}
                    animate={{ y: ['0vh', '110vh'], opacity: [0, 0.8, 0] }}
                    transition={{
                        duration: 1.5 + (i % 4) * 0.5,
                        repeat: Infinity,
                        delay: (i * 0.15) % 3,
                        ease: 'linear',
                    }}
                />
            ))}
        </div>
    );
}

import { Station, AnalysisResult } from '@/types/station';

export default function RainfallPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [allStations, setAllStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [correlation, setCorrelation] = useState<number | null>(null);

    // 1. Load initial stations for selection
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const res = await api.get('/stations');
                if (res.data.success) setAllStations(res.data.data);
            } catch (err) {
                console.error('Failed to load stations', err);
            }
        };
        fetchStations();
    }, []);

    // 2. Fetch specific analysis when station changes
    useEffect(() => {
        if (!selectedStation) {
            setAnalysis(null);
            return;
        }
        const fetchAnalysis = async () => {
            setAnalysisLoading(true);
            try {
                const res = await api.get(`/analysis/${selectedStation.stationId}`);
                if (res.data.success) setAnalysis(res.data.data);
            } catch (err) {
                console.error('Analysis fetch failed', err);
            } finally {
                setAnalysisLoading(false);
            }
        };
        fetchAnalysis();
    }, [selectedStation]);

    const loadData = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const stateName = f.state || 'Telangana';

            // Fetch rainfall from Open-Meteo for state overview
            const [rainData, gwRes] = await Promise.all([
                fetchRainfall(stateName),
                api.get('/groundwater', { params: { state: stateName, limit: '500', sort: 'date:1' } })
            ]);

            const gwData = gwRes.data.data ?? [];

            // Build monthly aggregates
            const byMonth: Record<string, { rain: number; wl: number[]; count: number }> = {};
            rainData.forEach(r => {
                const m = r.date.substring(0, 7);
                if (!byMonth[m]) byMonth[m] = { rain: 0, wl: [], count: 0 };
                byMonth[m].rain += r.rainfall;
                byMonth[m].count++;
            });
            gwData.forEach((r: any) => {
                const m = r.date?.split('T')[0]?.substring(0, 7);
                if (m && byMonth[m] && r.waterLevelMbgl != null) {
                    byMonth[m].wl.push(r.waterLevelMbgl);
                }
            });

            const pts: ChartPoint[] = Object.entries(byMonth)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([m, v]) => ({
                    date: `${m}-01`,
                    rainfall: +v.rain.toFixed(1),
                    waterLevel: v.wl.length ? +(v.wl.reduce((a, b) => a + b, 0) / v.wl.length).toFixed(2) : null,
                }));

            setChartData(pts);

            // Simple correlation
            const paired = pts.filter(p => p.waterLevel != null);
            if (paired.length > 2) {
                const n = paired.length;
                const xs = paired.map(p => p.rainfall);
                const ys = paired.map(p => p.waterLevel!);
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
        ? correlation < -0.3 ? '↓ Negative correlation — groundwater drops when it rains more (delayed recharge)'
            : correlation > 0.3 ? '↑ Positive correlation — rainfall appears to support groundwater levels'
                : '→ Weak correlation — other factors dominate groundwater levels'
        : null;

    return (
        <div className="space-y-5 relative">
            <RainBackground />

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <CloudRain className="w-5 h-5 text-blue-400" />
                    <h1 className="text-2xl font-bold text-white">Rainfall Analysis</h1>
                </div>
                <p className="text-slate-400 text-sm">Correlating rainfall patterns with groundwater levels · Open-Meteo data</p>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <FilterBar states={INDIA_STATES} value={filters} onChange={setFilters} />
                </div>
                <div className="w-full md:w-80">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                            onChange={(e) => {
                                const s = allStations.find(st => st.stationId === e.target.value);
                                setSelectedStation(s || null);
                            }}
                            value={selectedStation?.stationId || ''}
                        >
                            <option value="">Select Station for Site Analysis...</option>
                            {allStations
                                .filter(s => s.stateName === filters.state)
                                .map(s => (
                                    <option key={s.stationId} value={s.stationId}>{s.stationName || s.stationId}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="relative z-10 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Site Specific Analysis Card */}
            <AnimatePresence>
                {selectedStation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 p-1 rounded-3xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-white/10"
                    >
                        <div className="bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Station Analysis: {selectedStation.stationName}</h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">{selectedStation.districtName}, {selectedStation.stateName}</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                    Backend Verified
                                </div>
                            </div>

                            {analysisLoading ? (
                                <div className="py-10 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-xs text-slate-400">Consulting historical trends...</p>
                                </div>
                            ) : analysis ? (
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Groundwater Trend</p>
                                        <div className="flex items-center gap-3">
                                            {analysis.groundwaterTrend === 'Increasing' ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                                            <span className={`text-lg font-bold ${analysis.groundwaterTrend === 'Increasing' ? 'text-green-400' : 'text-red-400'}`}>
                                                {analysis.groundwaterTrend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Historical Rainfall</p>
                                        <div className="flex items-center gap-3">
                                            <CloudRain className="w-5 h-5 text-blue-400" />
                                            <span className="text-lg font-bold text-blue-300">{analysis.rainfallTrend}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-cyan-400" />
                                            <span className="text-[10px] uppercase font-bold text-cyan-400">Strategic Insight</span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                            {analysis.impact}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Select a station to view backend-verified analysis.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Correlation insight (Statewide) */}
            {!selectedStation && correlation != null && (
                <motion.div
                    className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-slate-900/80 backdrop-blur border border-white/5 rounded-2xl p-5">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Correlation R</p>
                        <p className={`text-3xl font-bold ${Math.abs(correlation) > 0.5 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                            {correlation}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Pearson coefficient</p>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur border border-white/5 rounded-2xl p-5 md:col-span-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Interpretation</p>
                        <div className="flex items-start gap-2">
                            {(correlation ?? 0) < 0
                                ? <TrendingDown className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                : <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
                            <p className="text-slate-300 text-sm">{corrLabel}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Chart */}
            <div className="relative z-10 bg-slate-900/80 backdrop-blur border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-white">Rainfall vs Groundwater Level</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Monthly — {filters.state || 'All States'} (last 3 months)</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
                </div>

                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short' })} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v}mm`} />
                            <YAxis yAxisId="right" orientation="right" reversed tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v}m`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Bar yAxisId="left" dataKey="rainfall" fill="#3b82f6" opacity={0.7} radius={[2, 2, 0, 0]} name="Rainfall (mm)" maxBarSize={30} animationDuration={1500} />
                            <Line yAxisId="right" type="monotone" dataKey="waterLevel" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} name="Water Level (m MBGL)" connectNulls animationDuration={1500} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-64 flex items-center justify-center">
                        {loading
                            ? <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            : <p className="text-slate-500 text-sm">No data available</p>}
                    </div>
                )}
            </div>

            {/* Impact insight */}
            <div className="relative z-10 bg-slate-900/80 backdrop-blur border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <h2 className="font-semibold text-white">Rainfall–Groundwater Impact</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
                        <p className="text-blue-400 font-medium mb-2">🌧️ If Rainfall Increases</p>
                        <p>Higher precipitation can recharge shallow aquifers over 1–3 months. Deep aquifer recharge may take much longer depending on soil permeability and land use.</p>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
                        <p className="text-orange-400 font-medium mb-2">☀️ If Rainfall Decreases</p>
                        <p>Extended dry periods accelerate depletion through increased extraction. Groundwater levels can drop significantly during consecutive low-rainfall years.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
