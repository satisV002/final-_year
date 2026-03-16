/**
 * Station core interface matching the backend stationLoader.service.ts
 */
export interface Station {
    stationId: string;
    stationName: string;
    stateName: string;
    districtName: string;
    villageName: string;
    lat: number;
    lng: number;
    agencyName: string;
    waterLevelMbgl?: number;
    source?: string;
}

/**
 * Detailed analysis result matching the backend /api/analysis/:stationId output
 */
export interface AnalysisResult {
    station: string;          // stationId or Name
    groundwaterTrend: 'Increasing' | 'Decreasing' | 'Stable' | 'No Data' | 'Unknown';
    rainfallTrend: string;
    impact: string;
    stationDetails?: Station;
    stationId?: string;
    correlationScore?: number;
    predictedNextMonthStatus?: string;
    recommendation?: string;
    recentData?: {
        avgLevel: number;
        avgRainfall: number;
        season: string;
    };
}

/**
 * Historical/Live groundwater record clean format
 */
export interface StationRecord extends Station {
    _id: string;
    date: string;
    waterLevelMbgl: number;
    trend?: string;
    rainfall?: number;
}

export interface GroundwaterRecord {
    date: string;
    level: number;
    agency: string;
}
