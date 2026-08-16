import React from 'react';

interface ProgressBarProps {
  percent: number;
  scanned: number;
  total: number;
  currentFile: string;
  status: string;
}

export default function ProgressBar({ percent, scanned, total, currentFile, status }: ProgressBarProps) {
  const isActive = status === 'SCANNING';
  const isDone = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  const barColor = isFailed
    ? 'bg-red-500'
    : isDone
    ? 'bg-emerald-500'
    : 'bg-amber-500';

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          {isDone ? 'Scan Complete' : isFailed ? 'Scan Failed' : 'Scanning Dataset...'}
        </h3>
        <span className="text-xl font-bold text-white">{percent.toFixed(1)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor} ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {scanned.toLocaleString()} / {total.toLocaleString()} images
        </span>
        {isActive && currentFile && (
          <span className="text-gray-500 truncate max-w-[50%]">
            Current: {currentFile}
          </span>
        )}
      </div>
    </div>
  );
}
