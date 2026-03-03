'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import {
    ChevronLeft, ChevronRight, Download, Loader2, AlertTriangle,
    TrendingUp, TrendingDown, Minus, ArrowUpDown
} from 'lucide-react';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
];

interface GWRecord {
    _id: string;
    location: { state: string; district?: string; block?: string; village?: string; stationId?: string; pinCode?: string; };
    date: string;
    waterLevelMbgl: number;
    trend?: string;
    source: string;
}

interface Pagination { page: number; limit: number; totalPages: number; totalRecords: number; }

const COLUMNS = [
    { key: 'location.stationId', label: 'Station ID' },
    { key: 'location.state', label: 'State' },
    { key: 'location.district', label: 'District' },
    { key: 'location.block', label: 'Block' },
    { key: 'location.village', label: 'Village' },
    { key: 'location.pinCode', label: 'PIN Code' },
    { key: 'date', label: 'Date' },
    { key: 'waterLevelMbgl', label: 'Water Level (m)' },
    { key: 'trend', label: 'Trend' },
    { key: 'source', label: 'Source' },
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
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
            <Icon className="w-3 h-3" />{trend}
        </span>
    );
}

function downloadCSV(data: GWRecord[]) {
    const header = ['Station ID', 'State', 'District', 'Block', 'Village', 'PIN Code', 'Date', 'Water Level (m)', 'Trend', 'Source'];
    const rows = data.map(r => [
        r.location.stationId, r.location.state, r.location.district, r.location.block,
        r.location.village, r.location.pinCode,
        new Date(r.date).toLocaleDateString('en-IN'),
        r.waterLevelMbgl, r.trend, r.source
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `groundwater_${Date.now()}.csv`;
    a.click();
}

export default function DataPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [records, setRecords] = useState<GWRecord[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('date:-1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (f: Filters, p: number, s: string) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { page: String(p), limit: '25', sort: s };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            if (f.stationId) params.stationName = f.stationId;
            if (f.fromDate) params.fromDate = f.fromDate;
            if (f.toDate) params.toDate = f.toDate;
            const res = await api.get('/groundwater', { params });
            setRecords(res.data.data ?? []);
            setPagination(res.data.pagination ?? null);
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
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Data Explorer</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {pagination ? `${pagination.totalRecords.toLocaleString()} total records` : 'Browse groundwater station data'}
                    </p>
                </div>
                <button onClick={() => downloadCSV(records)} disabled={!records.length}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-sm transition-all disabled:opacity-40">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={setFilters} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {COLUMNS.map(col => (
                                    <th key={col.key}
                                        onClick={() => toggleSort(col.key)}
                                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-300 transition-colors group"
                                    >
                                        <span className="flex items-center gap-1">
                                            {col.label}
                                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={COLUMNS.length} className="py-16 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
                                </td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={COLUMNS.length} className="py-16 text-center text-slate-500 text-sm">
                                    No records found — try adjusting filters
                                </td></tr>
                            ) : records.map(r => (
                                <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 text-xs font-mono text-cyan-400 whitespace-nowrap">{r.location.stationId ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.location.state}</td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.location.district ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.location.block ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.location.village ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{r.location.pinCode ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-mono font-bold ${r.waterLevelMbgl > 10 ? 'text-red-400'
                                                : r.waterLevelMbgl > 5 ? 'text-yellow-400'
                                                    : 'text-green-400'
                                            }`}>{r.waterLevelMbgl?.toFixed(2) ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3"><TrendBadge trend={r.trend} /></td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs text-slate-400">{r.source}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                        <p className="text-xs text-slate-500">
                            Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords.toLocaleString()} records)
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const pg = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                                return (
                                    <button key={pg} onClick={() => setPage(pg)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${pg === page
                                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                            : 'bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white'
                                            }`}>{pg}</button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
