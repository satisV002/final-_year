'use client';

import dynamic from 'next/dynamic';
import { ComponentType, useCallback, useEffect, useState } from 'react';
import api, { getApiErrorMessage } from '@/lib/axios';
import { Loader2, MapPin, AlertTriangle, Waves, Info } from 'lucide-react';
import FilterBar, { Filters } from '@/components/filters/FilterBar';
import { Station, AnalysisResult } from '@/types/station';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SearchAnimation from '@/components/ui/SearchAnimation';
import { RefreshCw } from 'lucide-react';

// Also extending the Station record since mock data has waterLevelMbgl at the root level
interface StationRecord extends Station {
    waterLevelMbgl: number;
    trend: string;
    agencyName: string;
    date: string;
}

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
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-white/5 rounded-3xl">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Initializing Map Engine...</p>
            </div>
        ),
    }
);

const INDIA_STATES = [
    'Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
    'Odisha', 'Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh',
];

export default function MapPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>({ state: 'Telangana' });
    const [allStations, setAllStations] = useState<StationRecord[]>([]);
    const [filteredStations, setFilteredStations] = useState<StationRecord[]>([]);
    const [selected, setSelected] = useState<Station | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // First try live data, if fails or empty, fall back to mock data
            let stationsData: StationRecord[] = [];

            try {
                // We use mock endpoint exclusively here to guarantee data visualization based on user request "make every page working with real visualizations using existing JSON"
                const res = await api.get('/mock/groundwater', { params: { limit: '500' } });
                const rawData = res.data.data ?? [];

                stationsData = rawData.map((s: any) => ({
                    ...s,
                    stationId: s.location?.stationId || '',
                    stationName: s.location?.stationName || s.location?.village || s.location?.stationId || 'Unknown Station',
                    stateName: s.location?.state || '',
                    districtName: s.location?.district || '',
                    villageName: s.location?.village || '',
                    lat: s.location?.coordinates?.coordinates?.[1] || 0,
                    lng: s.location?.coordinates?.coordinates?.[0] || 0,
                    agencyName: s.source || 'Unknown'
                }));
            } catch (fallbackErr) {
                throw fallbackErr;
            }

            // Deduplicate to show only the latest record per station on the map
            const latestMap = new Map<string, StationRecord>();
            stationsData.forEach(r => {
                if (!r.lat || !r.lng) return; // Must have coordinates
                const existing = latestMap.get(r.stationId);
                if (!existing || new Date(r.date) > new Date(existing.date)) {
                    latestMap.set(r.stationId, r);
                }
            });

            setAllStations(Array.from(latestMap.values()));
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

    // 3. Fetch Analysis (Mocked for immediate interaction based on selected station)
    useEffect(() => {
        if (!selected) {
            setAnalysis(null);
            return;
        }

        const runAnalysis = async () => {
            setAnalysisLoading(true);
            try {
                // Simulate network delay for live map feel
                await new Promise(resolve => setTimeout(resolve, 800));

                // Construct mock analysis based on current selected station state
                const lvl = selected.waterLevelMbgl || 0;
                const trend = (selected as StationRecord).trend || 'Stable';
                setAnalysis({
                    station: selected.stationName || selected.stationId,
                    stationId: selected.stationId,
                    impact: lvl > 10 ? 'Severe' : lvl > 5 ? 'Moderate' : 'Low',
                    groundwaterTrend: trend === 'Rising' ? 'Increasing' : trend === 'Falling' ? 'Decreasing' : 'Stable',
                    rainfallTrend: 'Average',
                    correlationScore: 0.75,
                    predictedNextMonthStatus: lvl > 10 ? 'Critical' : lvl > 5 ? 'Warning' : 'Safe',
                    recommendation: lvl > 10 ? 'Immediate artificial recharge recommended. strict extraction limits.' : 'Monitor levels. Encourage rainwater harvesting.',
                    recentData: {
                        avgLevel: lvl,
                        avgRainfall: 120,
                        season: 'Pre-Monsoon'
                    }
                });
            } catch (err) {
                console.error('Analysis generation failed', err);
            } finally {
                setAnalysisLoading(false);
            }
        };
        runAnalysis();
    }, [selected]);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Interactive <span className="text-cyan-400">Groundwater</span> Map</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {loading ? 'Initializing spatial data...' : `Displaying ${filteredStations.length} active monitoring nodes`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-slate-800 disabled:opacity-50 shadow-lg"
                        title="Refresh Spatial Data"
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
                        <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-12">
                            <SearchAnimation />
                        </div>
                    ) : (
                        <LeafletMap stations={filteredStations} onSelect={setSelected} selectedId={selected?.stationId} />
                    )}

                    {/* Floating Instruction */}
                    {!selected && filteredStations.length > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Click any node on the map to view detailed analytics
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
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                                        <MapPin className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-bold text-white truncate" title={selected.stationName || selected.stationId}>{selected.stationName || selected.stationId}</h3>
                                        <p className="text-xs text-slate-500 uppercase font-medium tracking-wide truncate">{selected.districtName}, {selected.stateName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors leading-none flex-shrink-0">×</button>
                            </div>

                            <div className="space-y-4">
                                {analysisLoading ? (
                                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                                        <p className="text-xs text-slate-400 font-medium">Running Spatial Analysis...</p>
                                    </div>
                                ) : analysis ? (
                                    <>
                                        {/* Trends Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                                    <Waves className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Water Trend</span>
                                                </div>
                                                <p className={`text-sm font-bold ${analysis.groundwaterTrend === 'Increasing' ? 'text-green-400' :
                                                    analysis.groundwaterTrend === 'Decreasing' ? 'text-red-400' : 'text-slate-300'
                                                    }`}>
                                                    {analysis.groundwaterTrend}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-2 text-slate-400">
                                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-wider">Risk Level</span>
                                                </div>
                                                <p className={`text-sm font-bold ${analysis.predictedNextMonthStatus === 'Safe' ? 'text-green-400' :
                                                    analysis.predictedNextMonthStatus === 'Critical' ? 'text-red-400' : 'text-orange-400'
                                                    }`}>
                                                    {analysis.predictedNextMonthStatus}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/20">
                                            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2">Current Reading</p>
                                            <p className="text-3xl font-black text-white tabular-nums">
                                                {selected.waterLevelMbgl?.toFixed(2) ?? '—'}<span className="text-sm font-medium text-slate-500 ml-1">m</span>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">Below Ground Level (MBGL)</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-800/30 border border-white/5">
                                            <h4 className="text-xs font-semibold text-slate-300 mb-2">Automated Recommendation</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                {analysis.recommendation}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => router.push(`/stations?id=${selected.stationId}`)}
                                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all mt-4"
                                        >
                                            View Full Station History
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        Analysis data unavailable
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
