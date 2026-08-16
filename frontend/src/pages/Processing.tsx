import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  Zap,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  PawPrint,
  MapPin,
  Bell,
  Eye,
} from 'lucide-react';
import { DEMO_PROCESSING_FINAL_STATS } from '../data/centralData';

type ProcessingStage =
  | 'INITIALIZING'
  | 'SCANNING IMAGES'
  | 'VALIDATING DATA'
  | 'TRIAGING IMAGES'
  | 'DETECTING TIGERS'
  | 'IDENTIFYING INDIVIDUALS'
  | 'ANALYZING MOVEMENT'
  | 'GENERATING ALERTS'
  | 'COMPLETE';

const STAGES: { stage: ProcessingStage; label: string; icon: string }[] = [
  { stage: 'INITIALIZING', label: 'Initializing Pipeline', icon: '⚙️' },
  { stage: 'SCANNING IMAGES', label: 'Scanning Images', icon: '📂' },
  { stage: 'VALIDATING DATA', label: 'Validating Data & EXIF', icon: '🔍' },
  { stage: 'TRIAGING IMAGES', label: 'Triaging Blanks & Wildlife', icon: '🍃' },
  { stage: 'DETECTING TIGERS', label: 'Tiger Detection', icon: '🐯' },
  { stage: 'IDENTIFYING INDIVIDUALS', label: 'Individual Identification', icon: '🆔' },
  { stage: 'ANALYZING MOVEMENT', label: 'Analyzing Movement', icon: '🗺️' },
  { stage: 'GENERATING ALERTS', label: 'Generating Threat Alerts', icon: '🔔' },
  { stage: 'COMPLETE', label: 'Processing Complete', icon: '✅' },
];

const STATIONS_LIST = ['CAM_01', 'CAM_03', 'CAM_05', 'CAM_07', 'CAM_11', 'CAM_15', 'CAM_18', 'CAM_27'];

export default function Processing() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [speedFps, setSpeedFps] = useState<number>(142);
  const [currentStation, setCurrentStation] = useState<string>('CAM_07');

  const totalImages = DEMO_PROCESSING_FINAL_STATS.totalImages;
  const intervalRef = useRef<any>(null);

  const startProcessing = () => {
    setIsProcessing(true);
    setStageIndex(0);
    setProgressPercent(0);
    setProcessedCount(0);
    setSpeedFps(142);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setProgressPercent((prevPercent) => {
        const nextPercent = prevPercent + 2.5;

        // Calculate stage based on percentage
        if (nextPercent < 5) setStageIndex(0);
        else if (nextPercent < 15) setStageIndex(1);
        else if (nextPercent < 30) setStageIndex(2);
        else if (nextPercent < 45) setStageIndex(3);
        else if (nextPercent < 65) setStageIndex(4);
        else if (nextPercent < 80) setStageIndex(5);
        else if (nextPercent < 90) setStageIndex(6);
        else if (nextPercent < 100) setStageIndex(7);
        else {
          setStageIndex(8);
          setIsProcessing(false);
          clearInterval(intervalRef.current);
          return 100;
        }

        const count = Math.min(Math.round((nextPercent / 100) * totalImages), totalImages);
        setProcessedCount(count);

        // Randomize current station & speed slightly for realism
        const stationIdx = Math.floor((nextPercent / 100) * STATIONS_LIST.length) % STATIONS_LIST.length;
        setCurrentStation(STATIONS_LIST[stationIdx]);
        setSpeedFps(Math.floor(135 + Math.random() * 20));

        return nextPercent;
      });
    }, 200);
  };

  useEffect(() => {
    // Auto-start on first load for demonstration
    startProcessing();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentStageInfo = STAGES[stageIndex];
  const isComplete = progressPercent >= 100;

  // Remaining time estimate
  const remainingImages = totalImages - processedCount;
  const remainingSecs = speedFps > 0 ? Math.ceil(remainingImages / speedFps) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-amber-500" size={26} />
            Preda Vision AI Processing Pipeline
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Automated image triage, tiger detection, individual Re-ID, telemetry, and threat alert generation
          </p>
        </div>

        {isComplete && (
          <button
            onClick={startProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <RotateCcw size={16} />
            Process Again
          </button>
        )}
      </div>

      {/* Main Processing Box */}
      <div className="rounded-2xl border border-gray-800 bg-card p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap size={22} className={isProcessing ? 'animate-bounce' : ''} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isComplete ? 'PROCESSING COMPLETE' : 'PROCESSING DATASET'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Current Stage: <span className="text-amber-400 font-semibold">{currentStageInfo.label}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-400">{Math.round(progressPercent)}%</span>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {processedCount.toLocaleString()} / {totalImages.toLocaleString()} images
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 animate-pulse'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <MapPin size={14} className="text-amber-400" />
              Station: <strong className="text-white">{currentStation}</strong>
            </span>

            {isProcessing && (
              <div className="flex items-center gap-4 font-mono">
                <span className="text-amber-400 font-semibold">
                  Speed: {speedFps} images/sec
                </span>
                <span className="text-gray-400">
                  Est. Remaining: {remainingSecs}s
                </span>
              </div>
            )}

            {isComplete && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> Pipeline finished in 8.2s
              </span>
            )}
          </div>
        </div>

        {/* Processing Stages Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {STAGES.slice(0, 8).map((st, idx) => {
            const isDone = stageIndex > idx || isComplete;
            const isCurrent = stageIndex === idx && !isComplete;

            return (
              <div
                key={st.stage}
                className={`p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : isCurrent
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-gray-800/40 border-gray-800 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{st.icon} {st.label}</span>
                  {isDone && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Completion Summary Cards */}
      {isComplete && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">PROCESSING COMPLETE</h3>
                <p className="text-xs text-emerald-300">All 10,428 camera-trap images ingested & indexed successfully.</p>
              </div>
            </div>

            <button
              onClick={startProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md"
            >
              <RotateCcw size={16} />
              Process Again
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
              <span className="text-xs text-gray-400">Total Images</span>
              <p className="text-2xl font-black text-white">{totalImages.toLocaleString()}</p>
              <span className="text-[10px] text-gray-500">100% EXIF scanned</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Eye size={14} className="text-amber-400" /> False Triggers
              </span>
              <p className="text-2xl font-black text-amber-400">
                {DEMO_PROCESSING_FINAL_STATS.falseTriggers.toLocaleString()}
              </p>
              <span className="text-[10px] text-gray-500">75.2% empty scenes isolated</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <PawPrint size={14} className="text-orange-400" /> Tiger Detections
              </span>
              <p className="text-2xl font-black text-orange-400">
                {DEMO_PROCESSING_FINAL_STATS.tigerDetections.toLocaleString()}
              </p>
              <span className="text-[10px] text-gray-500">Bounding boxes localized</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Sparkles size={14} className="text-emerald-400" /> Identified Individuals
              </span>
              <p className="text-2xl font-black text-emerald-400">
                {DEMO_PROCESSING_FINAL_STATS.identifiedTigers.toLocaleString()}
              </p>
              <span className="text-[10px] text-gray-500">Cataloged to Re-ID Registry</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-card space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Bell size={14} className="text-red-400" /> Movement Alerts
              </span>
              <p className="text-2xl font-black text-red-400">
                {DEMO_PROCESSING_FINAL_STATS.movementAlerts}
              </p>
              <span className="text-[10px] text-gray-500">Buffer breaches & shifts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
