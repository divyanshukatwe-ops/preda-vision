import React, { useState } from 'react';
import { DEMO_TIGERS, DemoTiger, TIGER_SVG_FALLBACK_1, TIGER_SVG_FALLBACK_2 } from '../data/centralData';
import {
  PawPrint,
  Sparkles,
  MapPin,
  Calendar,
  ChevronLeft,
  Search,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export default function Tigers() {
  const [selectedTiger, setSelectedTiger] = useState<DemoTiger | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter logic
  const filteredTigers = DEMO_TIGERS.filter((tiger) => {
    const matchesSearch =
      tiger.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tiger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tiger.territoryZone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RANGE_SHIFT' && tiger.status === 'Range Shift') ||
      (statusFilter === 'ACTIVE_CORE' && tiger.status === 'Active Core') ||
      (statusFilter === 'BUFFER_ENTRY' && tiger.status === 'Buffer Entry') ||
      (statusFilter === 'PROLONGED_ABSENCE' && tiger.status === 'Prolonged Absence');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PawPrint className="text-amber-500" size={26} />
            Tiger Intelligence & Stripe Re-ID Registry
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pench Tiger Reserve · Automated flank stripe pattern identification & sighting profiles
          </p>
        </div>

        {selectedTiger && (
          <button
            onClick={() => setSelectedTiger(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-700 hover:text-white transition-all"
          >
            <ChevronLeft size={16} />
            Back to Tiger List
          </button>
        )}
      </div>

      {/* DETAILED TIGER PROFILE VIEW (If Tiger Selected) */}
      {selectedTiger ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Banner / Card */}
          <div className="rounded-2xl border border-gray-800 bg-card p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl">
            <div className="w-48 h-48 rounded-xl overflow-hidden border border-amber-500/30 shrink-0 bg-slate-900 shadow-md">
              <img
                src={selectedTiger.primaryImage || TIGER_SVG_FALLBACK_1}
                alt={selectedTiger.code}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = TIGER_SVG_FALLBACK_1;
                }}
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-amber-400">{selectedTiger.code}</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-300 font-semibold border border-gray-700">
                    {selectedTiger.gender === 'Female' ? '♀ Female' : '♂ Male'}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold border ${
                      selectedTiger.statusSeverity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : selectedTiger.statusSeverity === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    🔴 {selectedTiger.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400">Identification Confidence</span>
                  <p className="text-2xl font-black text-emerald-400">{selectedTiger.confidence}%</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white">{selectedTiger.name}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-400 shrink-0" />
                Territory Range: <strong className="text-gray-200">{selectedTiger.territoryZone}</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
                  <span className="text-gray-500">Sightings</span>
                  <p className="text-base font-bold text-white">{selectedTiger.sightingsCount} Captures</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
                  <span className="text-gray-500">Stations Visited</span>
                  <p className="text-base font-bold text-white">{selectedTiger.stationsCount} Stations</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
                  <span className="text-gray-500">Occupied Area</span>
                  <p className="text-base font-bold text-white">{selectedTiger.occupiedAreaKm2} km²</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs">
                  <span className="text-gray-500">Last Detected</span>
                  <p className="text-base font-bold text-amber-400">{selectedTiger.lastDetected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* IDENTIFICATION EVIDENCE PANEL */}
          <div className="rounded-2xl border border-gray-800 bg-card p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" />
              Identification Evidence & Flank Stripe Matching
            </h3>

            {/* Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <Eye size={14} className="text-amber-400" /> Current Camera Image ({selectedTiger.currentCameraId})
                </label>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-800 bg-slate-950 relative">
                  <img
                    src={selectedTiger.primaryImage || TIGER_SVG_FALLBACK_1}
                    alt="Current Capture"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = TIGER_SVG_FALLBACK_1;
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[11px] font-mono text-white">
                    {selectedTiger.lastDetected} · Station {selectedTiger.currentCameraId}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                  <PawPrint size={14} className="text-amber-400" /> Reference Tiger Image ({selectedTiger.code} Catalog)
                </label>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-800 bg-slate-950 relative">
                  <img
                    src={selectedTiger.referenceImage || TIGER_SVG_FALLBACK_2}
                    alt="Reference Capture"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = TIGER_SVG_FALLBACK_2;
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[11px] font-mono text-white">
                    Catalog Baseline · {selectedTiger.firstDetected}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <span className="text-xs text-gray-300 font-semibold">Stripe Similarity</span>
                <span className="text-lg font-black text-amber-400">{selectedTiger.stripeSimilarity}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <span className="text-xs text-gray-300 font-semibold">Identification Confidence</span>
                <span className="text-lg font-black text-emerald-400">{selectedTiger.confidence}%</span>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Evidence Checklist</h4>
              <div className="space-y-2">
                {selectedTiger.evidenceList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Stations */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Station Movement Trail</h4>
              <div className="flex flex-wrap items-center gap-2">
                {selectedTiger.routeStations.map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono font-bold text-amber-400">
                      {st}
                    </span>
                    {idx < selectedTiger.routeStations.length - 1 && (
                      <ArrowRight size={14} className="text-gray-600" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TIGER LIST VIEW */
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-800 bg-card">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tiger ID (e.g. T-003)..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'All Tigers' },
                { id: 'RANGE_SHIFT', label: '🔴 Range Shift' },
                { id: 'ACTIVE_CORE', label: '🟢 Active Core' },
                { id: 'BUFFER_ENTRY', label: '🟡 Buffer Entry' },
                { id: 'PROLONGED_ABSENCE', label: '⚠️ Prolonged Absence' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === filter.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiger Cards Grid */}
          {filteredTigers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTigers.map((tiger) => (
                <div
                  key={tiger.id}
                  onClick={() => setSelectedTiger(tiger)}
                  className="group rounded-2xl border border-gray-800 bg-card overflow-hidden hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header */}
                    <div className="h-44 w-full bg-slate-950 relative overflow-hidden border-b border-gray-800">
                      <img
                        src={tiger.primaryImage || TIGER_SVG_FALLBACK_1}
                        alt={tiger.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = TIGER_SVG_FALLBACK_1;
                        }}
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-amber-400 font-extrabold text-sm border border-amber-500/30">
                        {tiger.code}
                      </div>

                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-emerald-400 font-bold text-xs border border-emerald-500/30">
                        {tiger.confidence}% ID
                      </div>

                      <div className="absolute bottom-2 left-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[11px] text-gray-300">
                        Last detected: <strong className="text-white">{tiger.lastDetected}</strong>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                          {tiger.name}
                        </h3>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            tiger.statusSeverity === 'critical'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : tiger.statusSeverity === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          🔴 {tiger.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-800/60">
                        <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
                          <span className="text-gray-500 block text-[10px]">Sightings</span>
                          <strong className="text-white">{tiger.sightingsCount} Sightings</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-900/60 border border-gray-800">
                          <span className="text-gray-500 block text-[10px]">Stations</span>
                          <strong className="text-white">{tiger.stationsCount} Stations</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900/40 border-t border-gray-800">
                    <button className="w-full py-2 rounded-xl bg-gray-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-gray-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                      <Eye size={14} />
                      Inspect Tiger Profile & Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 text-sm bg-card rounded-2xl border border-gray-800">
              No tiger profiles match the selected filter. Try adjusting your search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
