'use client';

import dynamic from 'next/dynamic';
import { ComponentType, useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import { Loader2, MapPin, AlertTriangle, CloudRain, Waves, Activity, Info } from 'lucide-react';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import { Station, AnalysisResult } from '@/types/station';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SearchAnimation from '@/components/ui/SearchAnimation';
import { RefreshCw } from 'lucide-react';

interface MapProps {
    stations: Station[];
    onSelect: (s: Station) => void;
    selectedId?: string;
}

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
const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
    'Bihar', 'West Bengal', 'Punjab', 'Haryana', 'Kerala', 'Assam',
];

export default function MapPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [allStations, setAllStations] = useState<Station[]>([]);
    const [filteredStations, setFilteredStations] = useState<Station[]>([]);
    const [selected, setSelected] = useState<Station | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/stations');
            if (res.data.success) {
                setAllStations(res.data.data);
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // 1. Initial Load
    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // 2. Client-side filtering when filters or allStations change
    useEffect(() => {
        let filtered = allStations;
        if (filters.state) {
            filtered = filtered.filter(s => s.stateName.toLowerCase() === filters.state?.toLowerCase());
        }
        if (filters.district) {
            filtered = filtered.filter(s => s.districtName.toLowerCase() === filters.district?.toLowerCase());
        }
        setFilteredStations(filtered);
    }, [allStations, filters]);

    // 3. Fetch Analysis when a station is selected
    useEffect(() => {
        if (!selected) {
            setAnalysis(null);
            return;
        }

        const fetchAnalysis = async () => {
            setAnalysisLoading(true);
            try {
                const res = await api.get(`/analysis/${selected.stationId}`);
                if (res.data.success) {
                    setAnalysis(res.data.data);
                }
            } catch (err) {
                console.error('Analysis fetch failed', err);
            } finally {
                setAnalysisLoading(false);
            }
        };
        fetchAnalysis();
    }, [selected]);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Real-time <span className="text-cyan-400">Groundwater</span> Map</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {loading ? 'Fetching stations...' : `Displaying ${filteredStations.length} of ${allStations.length} nationwide monitoring points`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />}
                </div>
            </div>

            <FilterBar states={INDIA_STATES} value={filters} onChange={setFilters} />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
            )}

            {/* Map Area */}
            <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-slate-900">
                    {loading && allStations.length === 0 ? (
                        <div className="absolute inset-0 z-[2000] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-12">
                            <SearchAnimation />
                        </div>
                    ) : (
                        <LeafletMap stations={filteredStations} onSelect={setSelected} selectedId={selected?.stationId} />
                    )}

                    {/* Floating Instruction */}
                    {!selected && filteredStations.length > 0 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full text-xs text-cyan-400 shadow-lg flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" />
                            Click any marker to view live trend analysis
                        </div>
                    )}
                </div>

                {/* Analysis detail Panel */}
                <AnimatePresence mode="wait">
                    {selected && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-80 bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-bold text-white truncate">{selected.stationName || selected.stationId}</h3>
                                        <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">{selected.districtName}, {selected.stateName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1 hover:bg-white/5 rounded-lg text-slate-500 transition-colors leading-none">×</button>
                            </div>

                            <div className="space-y-4">
                                {analysisLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                                        <p className="text-xs text-slate-400">Fetching live WRIS data...</p>
                                    </div>
                                ) : analysis ? (
                                    <>
                                        {/* Trends Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                                    <Waves className="w-4 h-4 text-blue-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Groundwater</span>
                                                </div>
                                                <p className={`text-sm font-bold ${analysis.groundwaterTrend === 'Increasing' ? 'text-green-400' :
                                                    analysis.groundwaterTrend === 'Decreasing' ? 'text-red-400' : 'text-slate-300'
                                                    }`}>
                                                    {analysis.groundwaterTrend}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                                    <CloudRain className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Rainfall</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300">{analysis.rainfallTrend}</p>
                                            </div>
                                        </div>

                                        {/* Impact Card */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className="w-4 h-4 text-cyan-400" />
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Strategic Impact</span>
                                            </div>
                                            <p className="text-sm font-medium text-white leading-relaxed">
                                                {analysis.impact}
                                            </p>
                                        </div>

                                        {/* Footer Detail */}
                                        <div className="pt-4 border-t border-white/5 space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">ID</span>
                                                <span className="text-slate-300 font-mono">{selected.stationId}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Agency</span>
                                                <span className="text-slate-300">{selected.agencyName}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Taluka</span>
                                                <span className="text-slate-300">{selected.villageName || '—'}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-6 text-center text-slate-500">
                                        <p className="text-sm">Failed to load analysis for this station.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-semibold text-slate-300 transition-all uppercase tracking-widest"
                                onClick={() => router.push(`/stations?id=${selected.stationId}`)}
                            >
                                View History
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
