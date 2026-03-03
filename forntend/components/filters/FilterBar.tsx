'use client';

import { useState } from 'react';
import { Filter, CalendarRange, X } from 'lucide-react';

export interface Filters {
    state?: string;
    district?: string;
    stationId?: string;
    fromDate?: string;
    toDate?: string;
}

interface FilterBarProps {
    states: string[];
    value: Filters;
    onChange: (f: Filters) => void;
}

export default function FilterBar({ states, value, onChange }: FilterBarProps) {
    const [expanded, setExpanded] = useState(false);

    const update = (key: keyof Filters, val: string) =>
        onChange({ ...value, [key]: val || undefined });

    const clear = () => onChange({ state: value.state });

    const active = !!(value.district || value.stationId || value.fromDate || value.toDate);

    return (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
                {/* State */}
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 whitespace-nowrap">State</label>
                    <select
                        value={value.state ?? ''}
                        onChange={e => update('state', e.target.value)}
                        className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40"
                    >
                        <option value="">All States</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Toggle more filters */}
                <button
                    onClick={() => setExpanded(e => !e)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-all ${active ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    More Filters
                    {active && <span className="w-2 h-2 bg-cyan-500 rounded-full" />}
                </button>

                {active && (
                    <button onClick={clear} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            {expanded && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                    {/* District */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 whitespace-nowrap">District</label>
                        <input
                            type="text" placeholder="e.g. Baleshwar"
                            value={value.district ?? ''}
                            onChange={e => update('district', e.target.value)}
                            className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 w-36 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 placeholder-slate-600"
                        />
                    </div>

                    {/* Station ID */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 whitespace-nowrap">Station ID</label>
                        <input
                            type="text" placeholder="e.g. CGWBHU2326"
                            value={value.stationId ?? ''}
                            onChange={e => update('stationId', e.target.value)}
                            className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 placeholder-slate-600"
                        />
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-slate-500" />
                        <input
                            type="date" value={value.fromDate ?? ''}
                            onChange={e => update('fromDate', e.target.value)}
                            className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                        <span className="text-slate-600 text-xs">to</span>
                        <input
                            type="date" value={value.toDate ?? ''}
                            onChange={e => update('toDate', e.target.value)}
                            className="bg-slate-800 border border-white/10 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
