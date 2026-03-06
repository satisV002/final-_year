'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { Station } from '@/types/station';

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
    const clusterRef = useRef<any>(null);

    // Initialize map once
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return;

        // Dynamic import of markercluster plugin (needs window/L global)
        require('leaflet.markercluster');

        mapRef.current = L.map(containerRef.current, {
            center: [22.9734, 78.6569], // Center of India
            zoom: 5,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap ©CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(mapRef.current!);

        // @ts-ignore
        clusterRef.current = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            chunkedLoading: true // Performance booster for 24k markers
        });
        mapRef.current.addLayer(clusterRef.current);

        mapRef.current.invalidateSize();

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when stations change
    useEffect(() => {
        if (!mapRef.current || !clusterRef.current) return;
        const cluster = clusterRef.current;

        // Clear old markers
        cluster.clearLayers();

        const markers: L.Marker[] = [];
        stations.forEach(station => {
            const { lat, lng, stationId, stationName, waterLevelMbgl } = station;
            if (!lat || !lng) return;

            const selected = station.stationId === selectedId;
            const color = getMarkerColor(waterLevelMbgl || 0);
            const marker = L.marker([lat, lng], { icon: createMarker(color, selected) });

            marker.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; box-shadow: 0 0 8px ${color}aa;"></div>
                    <p style="font-weight: 700; color: #fff; margin: 0; font-size: 13px;">${stationName || stationId}</p>
                  </div>
                  <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px;">${station.districtName}, ${station.stateName}</p>
                    <div style="display: flex; justify-content: mb-1; flex-direction: column; gap: 2px;">
                       <p style="color: #64748b; font-size: 10px; margin: 0;">Level: <span style="color: ${color}; font-weight: 600;">${waterLevelMbgl?.toFixed(2) ?? '—'} m MBGL</span></p>
                       <p style="color: #64748b; font-size: 10px; margin: 0;">Source: <span style="color: #cbd5e1;">${station.agencyName}</span></p>
                    </div>
                  </div>
                  <p style="color: #06b6d4; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 10px; text-align: center;">Click for Analytics</p>
                </div>
              `, { className: 'dark-popup' });

            marker.on('click', () => onSelect(station));
            markers.push(marker);
        });

        cluster.addLayers(markers);
    }, [stations, selectedId, onSelect]);

    return (
        <>
            <style>{`
        .leaflet-popup-content-wrapper { background: #0f172a; border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; color: #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); }
        .leaflet-popup-tip { background: #0f172a; border: 1px solid rgba(6, 182, 212, 0.2); }
        .leaflet-control-zoom a { background: #1e293b; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; margin-bottom: 4px; }
        .leaflet-control-zoom a:hover { background: #334155; color: #06b6d4; }
        .leaflet-popup-content { margin: 12px; }
        
        /* Marker Cluster Custom Styles - Cyan/Blue Theme */
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background-color: rgba(6, 182, 212, 0.15);
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background-color: rgba(6, 182, 212, 0.6);
          color: white;
          font-weight: 800;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .marker-cluster div {
          width: 32px;
          height: 32px;
          margin-left: 4px;
          margin-top: 4px;
          text-align: center;
          border-radius: 50%;
          font-size: 11px;
          line-height: 32px;
        }
      `}</style>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </>
    );
}

