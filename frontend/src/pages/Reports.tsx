import React from 'react';
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  PawPrint,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_PROCESSING_FINAL_STATS, DEMO_TIGERS } from '../data/centralData';

export default function Reports() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-amber-500" size={26} />
            Wildlife Intelligence & Population Audit Reports
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pench Tiger Reserve · Automated survey reporting, species density, & spatial occupancy metrics
          </p>
        </div>

        <button
          onClick={() => alert('PDF Audit Report exported successfully.')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <Download size={16} />
          Export PDF Survey Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
          <span className="text-xs text-gray-400">Total Survey Images</span>
          <p className="text-2xl font-black text-white">{DEMO_PROCESSING_FINAL_STATS.totalImages.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> 100% Quality Audited
          </span>
        </div>

        <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
          <span className="text-xs text-gray-400">Identified Individual Tigers</span>
          <p className="text-2xl font-black text-amber-400">{DEMO_TIGERS.length} Cataloged</p>
          <span className="text-[10px] text-gray-500">Stripe pattern verified</span>
        </div>

        <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
          <span className="text-xs text-gray-400">False-Trigger Triage Rate</span>
          <p className="text-2xl font-black text-emerald-400">75.2%</p>
          <span className="text-[10px] text-gray-500">7,842 empty scenes isolated</span>
        </div>

        <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
          <span className="text-xs text-gray-400">Active Camera Stations</span>
          <p className="text-2xl font-black text-purple-400">15 Stations</p>
          <span className="text-[10px] text-gray-500">Pench Core & Buffer</span>
        </div>
      </div>

      {/* Population & Sighting Breakdown Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-800 bg-card p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-400" />
            Individual Tiger Sightings Distribution
          </h2>

          <div className="space-y-3">
            {DEMO_TIGERS.map((tiger) => (
              <div key={tiger.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{tiger.code} — {tiger.name}</span>
                  <span className="font-mono text-amber-400">{tiger.sightingsCount} Captures</span>
                </div>
                <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${(tiger.sightingsCount / 70) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-card p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart size={18} className="text-amber-400" />
            Species Relative Abundance Index (RAI)
          </h2>

          <div className="space-y-3 text-xs">
            {[
              { species: '🐯 Panthera tigris (Tiger)', count: 640, pct: 24.8, color: 'bg-amber-500' },
              { species: '🐆 Panthera pardus (Leopard)', count: 312, pct: 12.1, color: 'bg-orange-500' },
              { species: '🐻 Melursus ursinus (Sloth Bear)', count: 185, pct: 7.2, color: 'bg-yellow-500' },
              { species: '🦌 Axis axis (Chital Deer)', count: 940, pct: 36.4, color: 'bg-emerald-500' },
              { species: '🐂 Bos gaurus (Gaur)', count: 504, pct: 19.5, color: 'bg-blue-500' },
            ].map((sp) => (
              <div key={sp.species} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{sp.species}</span>
                  <span>{sp.count} Detections ({sp.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${sp.color}`} style={{ width: `${sp.pct * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
