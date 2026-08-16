import React, { useState } from 'react';
import { TEST_SAMPLE_IMAGES, TestSampleImage } from '../data/centralData';
import {
  ListChecks,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Filter,
  Sparkles,
  Zap,
  Eye,
  Check,
  AlertTriangle,
  PawPrint,
} from 'lucide-react';

export default function ReviewQueue() {
  const [sampleFilter, setSampleFilter] = useState<'ALL' | 'TIGER' | 'BLANK' | 'WILDLIFE_FILLER'>('ALL');
  const [samples, setSamples] = useState<TestSampleImage[]>(TEST_SAMPLE_IMAGES);
  const [selectedSample, setSelectedSample] = useState<TestSampleImage | null>(null);

  const filteredSamples = samples.filter((s) => sampleFilter === 'ALL' || s.type === sampleFilter);

  const handleToggleQuarantine = (id: string) => {
    setSamples((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStatus = item.aiStatus === 'QUARANTINED' ? 'INDEXED' : 'QUARANTINED';
          return {
            ...item,
            aiStatus: newStatus,
            notes: newStatus === 'QUARANTINED'
              ? 'Manually Quarantined into false trigger isolation queue.'
              : 'Restored into active wildlife census stream.'
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListChecks className="text-amber-500" size={26} />
            AI Triage & Review Queue Test Suite
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Test real Tiger images, Blank/Empty scenes, and Wildlife filler photos to verify AI flagging decisions
          </p>
        </div>
      </div>

      {/* Control & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-gray-800 bg-card">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-amber-400" />
          <span className="text-xs font-bold text-gray-300">Filter Test Samples:</span>

          {[
            { id: 'ALL', label: `All Test Samples (${samples.length})` },
            { id: 'TIGER', label: `🐯 Tiger Captures (${samples.filter(s => s.type === 'TIGER').length})` },
            { id: 'BLANK', label: `🍃 Blank / Empty Scenes (${samples.filter(s => s.type === 'BLANK').length})` },
            { id: 'WILDLIFE_FILLER', label: `🦌 Wildlife Fillers (${samples.filter(s => s.type === 'WILDLIFE_FILLER').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSampleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sampleFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Quarantined Blank
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Passed to Re-ID
          </span>
        </div>
      </div>

      {/* AI Decision Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSamples.map((sample) => {
          const isQuarantined = sample.aiStatus === 'QUARANTINED';
          const isTiger = sample.type === 'TIGER';

          return (
            <div
              key={sample.id}
              className={`group rounded-2xl border bg-card overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                isQuarantined
                  ? 'border-red-500/40 bg-red-950/10 hover:border-red-500 shadow-lg shadow-red-950/20'
                  : isTiger
                  ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500 shadow-lg shadow-amber-950/20'
                  : 'border-gray-800 bg-gray-900/40 hover:border-emerald-500/50'
              }`}
            >
              <div>
                {/* Photo Header */}
                <div className="h-48 w-full bg-slate-950 relative overflow-hidden border-b border-gray-800">
                  <img
                    src={sample.url}
                    alt={sample.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><text x="300" y="200" font-family="sans-serif" font-size="18" fill="%2394a3b8" text-anchor="middle">PREDA VISION — ${sample.filename}</text></svg>`;
                    }}
                  />

                  {/* AI Status Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md font-mono text-xs font-bold border flex items-center gap-1.5">
                    {isQuarantined ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <ShieldAlert size={12} /> BLANK FLAGGED
                      </span>
                    ) : isTiger ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <PawPrint size={12} /> TIGER FLAGGED
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> WILDLIFE FLAGGED
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-emerald-400 font-black text-xs border border-emerald-500/30">
                    {sample.aiConfidence}% AI Conf
                  </div>

                  <div className="absolute bottom-2 left-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[11px] text-gray-300">
                    Station <strong className="text-white">{sample.stationId}</strong> · {sample.timestamp}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {sample.speciesLabel}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isQuarantined
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {sample.aiStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-400 space-y-1">
                    <strong className="text-gray-300 font-semibold block flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-400" /> AI Classification Note
                    </strong>
                    <p>{sample.notes}</p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-gray-900/60 border-t border-gray-800 flex items-center gap-2">
                <button
                  onClick={() => handleToggleQuarantine(sample.id)}
                  className={`w-full py-2 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    isQuarantined
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
                      : 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400'
                  }`}
                >
                  {isQuarantined ? (
                    <>
                      <RotateCcw size={14} /> Restore to Active Queue
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} /> Quarantine Image
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
