'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import {
    ChevronLeft, ChevronRight, Download, Loader2, AlertTriangle,
    TrendingUp, TrendingDown, Minus, ArrowUpDown, Database, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import { INDIA_STATES } from '@/lib/constants';
import { StationRecord } from '@/types/station';

interface Pagination { page: number; limit: number; totalPages: number; totalRecords: number; }

const COLUMNS = [
    { key: 'stationId', label: 'Station ID' },
    { key: 'stateName', label: 'State' },
    { key: 'districtName', label: 'District' },
    { key: 'villageName', label: 'Village' },
    { key: 'date', label: 'Date' },
    { key: 'waterLevelMbgl', label: 'Water Level (m)' },
    { key: 'trend', label: 'Trend' },
    { key: 'agencyName', label: 'Source' },
];

function TrendBadge({ trend }: { trend?: string }) {
    if (!trend) return <span className="text-slate-600">—</span>;
    const map: Record<string, { icon: React.ElementType; cls: string }> = {
        Rising: { icon: TrendingUp, cls: 'text-green-400 bg-green-400/10' },
        Falling: { icon: TrendingDown, cls: 'text-red-400 bg-red-400/10' },
        Stable: { icon: Minus, cls: 'text-yellow-400 bg-yellow-400/10' },
    };
    const cfg = map[trend] ?? { icon: Minus, cls: 'text-slate-400 bg-slate-400/10' };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cfg.cls}`}>
            <Icon className="w-3 h-3" />{trend}
        </span>
    );
}

function downloadCSV(data: StationRecord[]) {
    const header = ['Station ID', 'State', 'District', 'Village', 'Date', 'Water Level (m)', 'Trend', 'Source'];
    const rows = data.map(r => [
        r.stationId, r.stateName, r.districtName,
        r.villageName,
        new Date(r.date).toLocaleDateString('en-IN'),
        r.waterLevelMbgl, r.trend, r.agencyName
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `groundwater_export_${Date.now()}.csv`;
    a.click();
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-xl p-3 text-xs shadow-xl z-50">
            <p className="text-slate-400 font-semibold mb-1">{label}</p>
            <p className="text-cyan-400 font-bold">{payload[0].value} records</p>
        </div>
    );
};

export default function DataPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [records, setRecords] = useState<StationRecord[]>([]);
    const [chartData, setChartData] = useState<any[]>([]); // New mini-chart showing records per month
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('date:-1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (f: Filters, p: number, s: string) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch list data
            const params: Record<string, string> = { page: String(p), limit: '25', sort: s };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            if (f.stationId) params.stationName = f.stationId;

            // Hook into Mock API for guaranteed test data
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
            setPagination(res.data.pagination ?? null);

            // Fetch summary for timeline if on page 1
            if (p === 1) {
                const summaryRes = await api.get('/mock/groundwater', { params: { ...params, limit: '500', sort: 'date:1' } });
                const summaryData = summaryRes.data.data ?? [];

                const byYearMonth: any = {};
                summaryData.forEach((r: any) => {
                    const ym = r.date.substring(0, 7);
                    byYearMonth[ym] = (byYearMonth[ym] || 0) + 1;
                });
                const miniChart = Object.keys(byYearMonth).sort().map(k => ({
                    date: k,
                    count: byYearMonth[k]
                }));
                setChartData(miniChart);
            }

        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { setPage(1); }, [filters]);
    useEffect(() => { fetchData(filters, page, sort); }, [fetchData, filters, page, sort]);

    const toggleSort = (key: string) => {
        const dir = sort === `${key}:1` ? '-1' : '1';
        setSort(`${key}:${dir}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Data Explorer</h1>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {pagination ? `${pagination.totalRecords.toLocaleString()} primary records available` : 'Browse raw groundwater data'}
                        </p>
                    </div>
                </div>
                <button onClick={() => downloadCSV(records)} disabled={!records.length}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition-all disabled:opacity-40">
                    <Download className="w-4 h-4" /> Export Displayed CSV
                </button>
            </div>

            {/* Sub-Header Chart area for data context */}
            {chartData.length > 0 && !loading && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex gap-6 items-center">
                    <div className="flex-shrink-0">
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Time Series Context</p>
                        <p className="text-sm text-slate-400">Data frequency across records</p>
                    </div>
                    <div className="flex-grow h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#freqGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <FilterBar states={INDIA_STATES} value={filters} onChange={setFilters} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-800/20">
                                {COLUMNS.map(col => (
                                    <th key={col.key}
                                        onClick={() => toggleSort(col.key)}
                                        className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors group"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {col.label}
                                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading ? (
                                <tr><td colSpan={COLUMNS.length} className="py-20 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
                                    <p className="text-slate-500 text-xs mt-3">Loading records...</p>
                                </td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={COLUMNS.length} className="py-20 text-center text-slate-500 text-sm">
                                    <Activity className="w-8 h-8 opacity-20 mx-auto mb-3" />
                                    No records found — try adjusting filters
                                </td></tr>
                            ) : records.map(r => (
                                <tr key={r._id} className="group relative hover:bg-white/[0.04] transition-colors">
                                    <td className="px-5 py-3.5 text-xs font-mono text-cyan-400 whitespace-nowrap tabular-nums relative">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-cyan-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                        {r.stationId}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap font-medium">{r.stateName}</td>
                                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{r.districtName}</td>
                                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{r.villageName || '—'}</td>
                                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap tabular-nums">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`font-mono font-bold tabular-nums ${r.waterLevelMbgl > 10 ? 'text-red-400'
                                            : r.waterLevelMbgl > 5 ? 'text-orange-400'
                                                : 'text-emerald-400'
                                            }`}>
                                            {r.waterLevelMbgl?.toFixed(2) ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5"><TrendBadge trend={r.trend} /></td>
                                    <td className="px-5 py-3.5">
                                        <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-400 border border-white/5 shadow-inner">{r.agencyName}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/50">
                        <p className="text-xs text-slate-500">
                            Page <strong className="text-slate-300">{pagination.page}</strong> of <strong className="text-slate-300">{pagination.totalPages}</strong> <span className="mx-2 opacity-50">•</span> {pagination.totalRecords.toLocaleString()} total entries
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const pg = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                                if (pg < 1 || pg > pagination.totalPages) return null;
                                return (
                                    <button key={pg} onClick={() => setPage(pg)}
                                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${pg === page
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(6,182,212,0.3)] ring-1 ring-white/20'
                                            : 'bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white'
                                            }`}>{pg}</button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
