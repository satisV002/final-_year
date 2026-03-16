'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, Suspense } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    RadioTower, Search, Download, Loader2, AlertTriangle,
    TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie
} from 'recharts';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import SearchAnimation from '@/components/ui/SearchAnimation';

import { INDIA_STATES } from '@/lib/constants';
import { Station } from '@/types/station';

interface StationRecord extends Station {
    _id: string;
    date: string;
    waterLevelMbgl: number;
    trend?: string;
    source: string;
}

const PAGE_SIZE = 15;
const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#ec4899'];

export default function StationsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>}>
            <StationsContent />
        </Suspense>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl z-50 relative">
            <p className="text-slate-400 mb-2 font-semibold">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
                    {p.name}: {p.value}{p.name.includes('Level') ? 'm' : ''}
                </p>
            ))}
        </div>
    );
};

function StationsContent() {
    const searchParams = useSearchParams();
    const stationIdParam = searchParams.get('id');

    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [stations, setStations] = useState<StationRecord[]>([]);

    // Total Unique Stations from API (we fetch 500 records then unique them for charting)
    const [uniqueStations, setUniqueStations] = useState<StationRecord[]>([]);
    const [districtCounts, setDistrictCounts] = useState<any[]>([]);
    const [districtLevels, setDistrictLevels] = useState<any[]>([]);

    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (stationIdParam) setSearch(stationIdParam);
    }, [stationIdParam]);

    const fetchStations = useCallback(async (f: Filters, pg: number, q: string) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: '500', sort: 'date:-1' }; // Fetch max to build charts
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            if (q) params.stationName = q;

            // Using guaranteed mock data for visual consistency
            const res = await api.get('/mock/groundwater', { params });
            const rawData = res.data.data ?? [];

            const flattened: StationRecord[] = rawData.map((s: any) => ({
                ...s,
                stationId: s.location?.stationId || '',
                stateName: s.location?.state || '',
                districtName: s.location?.district || '',
                villageName: s.location?.village || '',
                agencyName: s.source || 'Unknown'
            }));

            // Process for Charts: Get Unique Stations (most recent record)
            const latestRecordsMap = new Map<string, StationRecord>();
            flattened.forEach(r => {
                if (!latestRecordsMap.has(r.stationId)) {
                    latestRecordsMap.set(r.stationId, r);
                } else {
                    const existing = latestRecordsMap.get(r.stationId)!;
                    if (new Date(r.date) > new Date(existing.date)) {
                        latestRecordsMap.set(r.stationId, r);
                    }
                }
            });

            const unique = Array.from(latestRecordsMap.values());
            setUniqueStations(unique);
            setTotal(unique.length);

            // Chart 1: District Station Counts
            const dCounts = unique.reduce((acc: any, curr) => {
                acc[curr.districtName] = (acc[curr.districtName] || 0) + 1;
                return acc;
            }, {});
            setDistrictCounts(Object.entries(dCounts).map(([name, count]) => ({ name, count })));

            // Chart 2: District Avg Water Levels
            const dLevels = unique.reduce((acc: any, curr) => {
                if (!acc[curr.districtName]) acc[curr.districtName] = { sum: 0, count: 0 };
                if (curr.waterLevelMbgl != null) {
                    acc[curr.districtName].sum += curr.waterLevelMbgl;
                    acc[curr.districtName].count += 1;
                }
                return acc;
            }, {});
            setDistrictLevels(Object.entries(dLevels).map(([name, v]: any) => ({
                name,
                avgLevel: v.count ? +(v.sum / v.count).toFixed(2) : 0
            })));

            // For Table: Apply pagination on unique stations client-side
            const start = (pg - 1) * PAGE_SIZE;
            setStations(unique.slice(start, start + PAGE_SIZE));

        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { setPage(1); }, [filters, search]);
    useEffect(() => { fetchStations(filters, page, search); }, [fetchStations, filters, page, search]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const trendIcon = (t?: string) =>
        t === 'Rising' ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> :
            t === 'Falling' ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                <Minus className="w-3.5 h-3.5 text-yellow-400" />;

    const levelColor = (v: number) =>
        v > 10 ? 'text-red-400' : v > 5 ? 'text-orange-400' : 'text-green-400';

    const handleExport = () => {
        if (!uniqueStations.length) return;
        const headers = ['Station ID', 'State', 'District', 'Village', 'Date', 'Water Level (m)', 'Trend', 'Source'];
        const rows = uniqueStations.map(s => [
            s.stationId, s.stateName, s.districtName, s.villageName || '',
            new Date(s.date).toLocaleDateString('en-IN'), s.waterLevelMbgl?.toFixed(2) ?? '',
            s.trend ?? '', s.agencyName
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'stations-summary.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <RadioTower className="w-5 h-5 text-emerald-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Stations Database</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Comprehensive view of monitoring infrastructure</p>
                    </div>
                </div>
                <button onClick={handleExport} disabled={!uniqueStations.length}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition disabled:opacity-40">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:block">Export Data</span>
                </button>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => setFilters(f)} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4 group">
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-500 rounded-full blur-2xl opacity-15" />
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Active</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/20 rounded-2xl p-4 group">
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-500 rounded-full blur-2xl opacity-15" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Districts Covered</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{districtCounts.length}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-red-950/30 border border-red-500/20 rounded-2xl p-4 group">
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-500 rounded-full blur-2xl opacity-15" />
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Critical Depletion (&gt;10m)</p>
                    <p className="text-2xl font-bold text-white tabular-nums">{uniqueStations.filter(s => s.waterLevelMbgl > 10).length}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-white/5 rounded-2xl p-4 group">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Average Depth</p>
                    <p className="text-2xl font-bold text-white tabular-nums">
                        {uniqueStations.length ? (uniqueStations.reduce((a, b) => a + (b.waterLevelMbgl || 0), 0) / uniqueStations.length).toFixed(1) : '0.0'}m
                    </p>
                </div>
            </div>

            {/* Visualizations row */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* District Coverage Distribution (Pie) */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Infrastructure Coverage (Districts)</h2>
                    {districtCounts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={districtCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="count" animationDuration={2000}>
                                    {districtCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>

                {/* Avg Water Level Per District (Bar) */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                    <h2 className="font-semibold text-white mb-4">Groundwater Depth per District</h2>
                    {districtLevels.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={districtLevels} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit="m" />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="avgLevel" fill="#0ea5e9" name="Avg Depth" radius={[0, 4, 4, 0]} animationDuration={2000} label={{ position: 'right', fill: '#64748b', fontSize: 10 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">No data</div>}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text" placeholder="Search by Station ID..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/8 text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder-slate-600"
                />
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Table */}
            {loading && uniqueStations.length === 0 ? (
                <div className="py-12"><SearchAnimation /></div>
            ) : (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-left">
                                    {['Station ID', 'State', 'District', 'Village', 'Date (Latest)', 'Level (m)', 'Trend', 'Source'].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {stations.map(s => (
                                    <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-emerald-400 whitespace-nowrap">{s.stationId}</td>
                                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.stateName}</td>
                                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{s.districtName}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.villageName || '—'}</td>
                                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`font-mono font-semibold ${levelColor(s.waterLevelMbgl)}`}>
                                                {s.waterLevelMbgl?.toFixed(2) ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {s.trend ? (
                                                <span className="flex items-center gap-1">
                                                    {trendIcon(s.trend)}
                                                    <span className="text-slate-400">{s.trend}</span>
                                                </span>
                                            ) : <span className="text-slate-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs text-slate-400 opacity-60">{s.agencyName}</span>
                                        </td>
                                    </tr>
                                ))}
                                {!stations.length && !loading && (
                                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                                        No stations found matching filters
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                            <span className="text-xs text-slate-500">Showing page {page} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition">
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
