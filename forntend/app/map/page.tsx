'use client';

import dynamic from 'next/dynamic';
import { ComponentType, useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import FilterBar, { Filters } from '@/components/filters/FilterBar';

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
];

interface Station {
    _id: string;
    location: {
        state: string; district?: string; village?: string;
        stationId?: string; pinCode?: string;
        coordinates?: { type: string; coordinates: [number, number] };
    };
    date: string;
    waterLevelMbgl: number;
    trend?: string;
}

interface MapProps {
    stations: Station[];
    onSelect: (s: Station) => void;
    selectedId?: string;
}

// Dynamic import for Leaflet (SSR disabled) — typed to preserve props
const LeafletMap = dynamic<MapProps>(
    () => import('@/components/map/GroundwaterMap') as Promise<{ default: ComponentType<MapProps> }>,
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading map...</p>
                </div>
            </div>
        ),
    }
);

export default function MapPage() {
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [stations, setStations] = useState<Station[]>([]);
    const [selected, setSelected] = useState<Station | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStations = useCallback(async (f: Filters) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { limit: '200' };
            if (f.state) params.state = f.state;
            if (f.district) params.district = f.district;
            const res = await api.get('/groundwater', { params });
            setStations(res.data.data ?? []);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStations(filters); }, [fetchStations, filters]);

    // Count stations with valid coordinates
    const withCoords = stations.filter(s =>
        s.location.coordinates?.coordinates?.length === 2 &&
        s.location.coordinates.coordinates[0] !== 0
    );

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Map View</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {loading ? 'Loading stations...' : `${withCoords.length} stations with location data`}
                    </p>
                </div>
                {loading && <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />}
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={setFilters} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Water Level:</span>
                {[
                    { color: 'bg-green-500', label: '< 5 m (Good)' },
                    { color: 'bg-yellow-500', label: '5–10 m (Moderate)' },
                    { color: 'bg-red-500', label: '> 10 m (Critical)' },
                ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${l.color}`} />
                        {l.label}
                    </span>
                ))}
            </div>

            {/* Map + Detail Panel */}
            <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5">
                    <LeafletMap stations={withCoords} onSelect={setSelected} selectedId={selected?._id} />
                </div>

                {/* Station Detail Panel */}
                {selected && (
                    <div className="w-72 bg-slate-900 border border-white/5 rounded-2xl p-5 overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{selected.location.stationId ?? 'Unknown'}</p>
                                    <p className="text-xs text-slate-500">Station Detail</p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
                        </div>

                        <div className="space-y-3 text-sm">
                            {[
                                ['State', selected.location.state],
                                ['District', selected.location.district],
                                ['Village', selected.location.village],
                                ['PIN Code', selected.location.pinCode],
                                ['Date', new Date(selected.date).toLocaleDateString('en-IN')],
                                ['Trend', selected.trend],
                            ].map(([k, v]) => v && (
                                <div key={k as string} className="flex justify-between">
                                    <span className="text-slate-500">{k}</span>
                                    <span className="text-slate-200 font-medium">{v as string}</span>
                                </div>
                            ))}

                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-xs mb-1">Water Level (MBGL)</p>
                                <p className={`text-3xl font-bold ${selected.waterLevelMbgl > 10 ? 'text-red-400'
                                    : selected.waterLevelMbgl > 5 ? 'text-yellow-400'
                                        : 'text-green-400'
                                    }`}>{selected.waterLevelMbgl?.toFixed(2)} m</p>
                                <p className={`text-xs mt-1 ${selected.waterLevelMbgl > 10 ? 'text-red-500'
                                    : selected.waterLevelMbgl > 5 ? 'text-yellow-500'
                                        : 'text-green-500'
                                    }`}>
                                    {selected.waterLevelMbgl > 10 ? '⚠️ Critical' : selected.waterLevelMbgl > 5 ? '⚡ Moderate' : '✅ Good'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
