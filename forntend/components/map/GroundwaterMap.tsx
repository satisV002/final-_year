'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface Props {
    stations: Station[];
    onSelect: (s: Station) => void;
    selectedId?: string;
}

function getMarkerColor(level: number): string {
    if (level > 10) return '#ef4444';   // red - critical
    if (level > 5) return '#eab308';  // yellow - moderate
    return '#22c55e';                   // green - good
}

function createMarker(color: string, selected: boolean) {
    return L.divIcon({
        className: '',
        html: `<div style="
      width: ${selected ? 18 : 14}px;
      height: ${selected ? 18 : 14}px;
      background: ${color};
      border: ${selected ? '3px solid white' : '2px solid rgba(255,255,255,0.6)'};
      border-radius: 50%;
      box-shadow: 0 0 ${selected ? 12 : 6}px ${color}88;
      transition: all 0.2s;
    "></div>`,
        iconSize: [selected ? 18 : 14, selected ? 18 : 14],
        iconAnchor: [selected ? 9 : 7, selected ? 9 : 7],
    });
}

export default function GroundwaterMap({ stations, onSelect, selectedId }: Props) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());

    // Initialize map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        mapRef.current = L.map(containerRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: true,
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap ©CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(mapRef.current!);
        mapRef.current.invalidateSize();

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when stations change
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current.clear();

        stations.forEach(station => {
            const coords = station.location.coordinates?.coordinates;
            if (!coords || coords.length < 2) return;
            const [lng, lat] = coords;
            if (!lat || !lng) return;

            const selected = station._id === selectedId;
            const color = getMarkerColor(station.waterLevelMbgl);
            const marker = L.marker([lat, lng], { icon: createMarker(color, selected) });

            marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px;">
          <p style="font-weight: 600; color: #e2e8f0; margin: 0 0 4px;">${station.location.stationId ?? 'Unknown'}</p>
          <p style="color: #94a3b8; font-size: 0.75rem; margin: 0 0 2px;">${station.location.district ?? ''}, ${station.location.state}</p>
          <p style="color: ${color}; font-size: 1rem; font-weight: 700; margin: 6px 0 0;">${station.waterLevelMbgl?.toFixed(2)} m MBGL</p>
          ${station.trend ? `<p style="color: #64748b; font-size: 0.7rem;">${station.trend}</p>` : ''}
        </div>
      `, { className: 'dark-popup' });

            marker.on('click', () => onSelect(station));
            marker.addTo(map);
            markersRef.current.set(station._id, marker);
        });
    }, [stations, selectedId, onSelect]);

    return (
        <>
            <style>{`
        .leaflet-popup-content-wrapper { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #e2e8f0; }
        .leaflet-popup-tip { background: #1e293b; }
        .leaflet-control-zoom a { background: #1e293b; color: #94a3b8; border-color: rgba(255,255,255,0.1); }
        .leaflet-control-zoom a:hover { background: #334155; color: #e2e8f0; }
      `}</style>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </>
    );
}
