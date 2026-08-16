import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEMO_STATIONS, DEMO_TIGERS, DemoStation, DemoTiger } from '../data/centralData';
import {
  Map as MapIcon,
  Navigation,
  Compass,
  Footprints,
  Camera,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function MovementMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedTigerId, setSelectedTigerId] = useState<string>('ALL');
  const [selectedStation, setSelectedStation] = useState<DemoStation | null>(null);

  const filteredTiger = selectedTigerId !== 'ALL'
    ? DEMO_TIGERS.find((t) => t.id === selectedTigerId)
    : null;

  const activeStations = selectedTigerId === 'ALL'
    ? DEMO_STATIONS
    : DEMO_STATIONS.filter((s) => filteredTiger?.routeStations.includes(s.id));

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map centered at Pench Reserve (21.75° N, 79.33° E)
    const map = L.map(mapContainerRef.current, {
      center: [21.75, 79.33],
      zoom: 12,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Dark Map Tile Layer (OpenStreetMap / CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18,
    }).addTo(map);

    // Draw Pench Reserve Core Zone Polygon
    const coreZoneCoords: [number, number][] = [
      [21.78, 79.29],
      [21.79, 79.35],
      [21.74, 79.38],
      [21.70, 79.34],
      [21.71, 79.28],
    ];
    L.polygon(coreZoneCoords, {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map).bindTooltip('Pench Core Reserve Zone', { permanent: false, direction: 'center' });

    // Draw Pench Reserve Buffer Zone Polygon
    const bufferZoneCoords: [number, number][] = [
      [21.84, 79.25],
      [21.85, 79.42],
      [21.65, 79.42],
      [21.65, 79.25],
    ];
    L.polygon(bufferZoneCoords, {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '8, 8',
    }).addTo(map).bindTooltip('Pench Outer Buffer Corridor Zone', { permanent: false, direction: 'center' });

    // Draw Tiger Movement Trajectory Routes
    const tigersToDraw = selectedTigerId === 'ALL'
      ? DEMO_TIGERS
      : DEMO_TIGERS.filter((t) => t.id === selectedTigerId);

    tigersToDraw.forEach((tiger) => {
      const routeCoords: [number, number][] = [];
      tiger.routeStations.forEach((stId) => {
        const st = DEMO_STATIONS.find((s) => s.id === stId);
        if (st) {
          routeCoords.push([st.latitude, st.longitude]);
        }
      });

      if (routeCoords.length > 1) {
        const routeLine = L.polyline(routeCoords, {
          color: tiger.id === 'T-003' ? '#ef4444' : '#f59e0b',
          weight: tiger.id === 'T-003' ? 4 : 3,
          opacity: 0.85,
        }).addTo(map);

        routeLine.bindTooltip(`Trajectory Vector: ${tiger.code} (${tiger.name})`, { sticky: true });
      }
    });

    // Draw Camera Stations as Markers
    DEMO_STATIONS.forEach((station) => {
      const isHighlighted = activeStations.some((s) => s.id === station.id);
      if (!isHighlighted && selectedTigerId !== 'ALL') return;

      const markerColor =
        station.status === 'alert'
          ? '#ef4444'
          : station.status === 'unusual'
          ? '#f59e0b'
          : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid #0f172a;
            box-shadow: 0 0 10px ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
          ">
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon: customIcon }).addTo(map);

      // Popup html
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
          <h4 style="margin: 0; font-weight: bold; color: #d97706;">${station.name} (${station.id})</h4>
          <p style="margin: 4px 0 0 0; font-size: 11px;">Zone: <strong>${station.zone.toUpperCase()}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px;">Tiger: <strong>${station.currentTigerId || 'None'}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px;">Last Detection: <strong>${station.lastDetectionTime}</strong></p>
          <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: bold; color: ${station.status === 'alert' ? '#dc2626' : '#059669'};">
            ${station.isNewForTiger ? '⚠️ New Station Detected' : '🟢 Station Active'}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => setSelectedStation(station));
    });

    // Invalidate size to prevent grey map containers
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedTigerId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapIcon className="text-amber-500" size={26} />
            Tiger Movement Map & Territory GIS
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time movement vector trajectories, core/buffer zone boundaries, and camera station telemetry
          </p>
        </div>
      </div>

      {/* Control Bar & Tiger Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-800 bg-card">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers size={18} className="text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-gray-300">Filter Tiger Trajectory:</span>

          <select
            value={selectedTigerId}
            onChange={(e) => setSelectedTigerId(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Tigers (Pench Reserve)</option>
            {DEMO_TIGERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> 🟢 Normal Station
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> 🟡 Unusual Activity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> 🔴 Alert Station (ST-27)
          </span>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="rounded-2xl border border-gray-800 bg-card p-4 space-y-4 shadow-xl">
        {/* LEAFLET MAP CONTAINER WITH REAL HEIGHT */}
        <div
          ref={mapContainerRef}
          className="h-[550px] w-full rounded-xl overflow-hidden border border-gray-800 z-10"
        />

        {/* Station Click Detail Banner */}
        {selectedStation && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <Camera size={20} className="text-amber-400" />
              <div>
                <h4 className="font-bold text-white text-sm">{selectedStation.name} ({selectedStation.id})</h4>
                <p className="text-gray-400 mt-0.5">
                  Zone: <strong className="text-amber-400 uppercase">{selectedStation.zone}</strong> · Last Detection: {selectedStation.lastDetectionTime} · Tiger: <strong className="text-white">{selectedStation.currentTigerId}</strong>
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-lg font-bold ${selectedStation.status === 'alert' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {selectedStation.isNewForTiger ? '⚠️ New Station Detected' : '🟢 Normal Activity'}
            </span>
          </div>
        )}
      </div>

      {/* Route Trajectory Trail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Footprints size={16} className="text-amber-400" />
            Selected Tiger Trajectory Trail
          </h3>

          {filteredTiger ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                <span className="font-bold text-amber-400">{filteredTiger.code} — {filteredTiger.name}</span>
                <span className="text-gray-400">{filteredTiger.occupiedAreaKm2} km² Range</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filteredTiger.routeStations.map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${st === 'ST-27' ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-gray-800 text-amber-400 border-gray-700'}`}>
                      {st}
                    </span>
                    {idx < filteredTiger.routeStations.length - 1 && (
                      <ArrowRight size={14} className="text-gray-600" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 py-4">
              Showing vector trails for all 6 registered tigers. Select a tiger from the dropdown to focus on its specific route.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass size={16} className="text-amber-400" />
            Pench Reserve Corridor Statistics
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-500">Core Stations</span>
              <p className="text-lg font-bold text-emerald-400">10 Active</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-500">Buffer Stations</span>
              <p className="text-lg font-bold text-amber-400">5 Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
