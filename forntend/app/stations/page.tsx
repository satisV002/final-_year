'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import {
    RadioTower, Search, Download, Loader2, AlertTriangle,
    TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import FilterBar, { Filters } from '@/components/filters/FilterBar';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
    'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh',
];

interface Station {
    _id: string;
    location: { state: string; district?: string; village?: string; stationId?: string; pinCode?: string; };
    date: string;
    waterLevelMbgl: number;
    trend?: string;
    source: string;
}

const PAGE_SIZE = 20;

export default function StationsPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [stations, setStations] = useState<Station[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchStations = useCallback(async (f: Filters, pg: number, q: string) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: String(PAGE_SIZE), page: String(pg), sort: 'date:-1' };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            if (q) params.stationName = q;
            if (f.fromDate) params.fromDate = f.fromDate;
            if (f.toDate) params.toDate = f.toDate;
            const res = await api.get('/groundwater', { params });
            setStations(res.data.data ?? []);
            setTotal(res.data.pagination?.totalRecords ?? 0);
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
        if (!stations.length) return;
        const headers = ['Station ID', 'State', 'District', 'Village', 'PIN Code', 'Date', 'Water Level (m)', 'Trend', 'Source'];
        const rows = stations.map(s => [
            s.location.stationId ?? '', s.location.state, s.location.district ?? '',
            s.location.village ?? '', s.location.pinCode ?? '',
            new Date(s.date).toLocaleDateString('en-IN'), s.waterLevelMbgl?.toFixed(2) ?? '',
            s.trend ?? '', s.source
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'stations.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <RadioTower className="w-5 h-5 text-emerald-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Stations</h1>
                        <p className="text-slate-400 text-sm mt-0.5">All DWLR monitoring stations</p>
                    </div>
                </div>
                <button onClick={handleExport} disabled={!stations.length}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition disabled:opacity-40">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:block">Download CSV</span>
                </button>
            </div>

            {/* Filters */}
            <FilterBar states={INDIA_STATES} value={filters} onChange={(f) => { setFilters(f); }} />

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text" placeholder="Search by Station ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/8 text-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder-slate-600"
                />
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `${total.toLocaleString()} total records`}
                </span>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-left">
                                {['Station ID', 'State', 'District', 'Village', 'PIN', 'Date', 'Level (m)', 'Trend', 'Source'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {stations.map(s => (
                                <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-emerald-400 whitespace-nowrap">{s.location.stationId ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.location.state}</td>
                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{s.location.district ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.location.village ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.location.pinCode ?? '—'}</td>
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
                                        <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs text-slate-400">{s.source}</span>
                                    </td>
                                </tr>
                            ))}
                            {!stations.length && !loading && (
                                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                                    No stations found — try adjusting filters
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
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
        </div>
    );
}
