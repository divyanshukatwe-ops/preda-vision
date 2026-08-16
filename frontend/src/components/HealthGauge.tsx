import React from 'react';

interface HealthGaugeProps {
  score: number; // 0-100
}

export default function HealthGauge({ score }: HealthGaugeProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label =
    score >= 80 ? 'Healthy' : score >= 50 ? 'Fair' : 'Poor';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          {/* Background circle */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{score.toFixed(0)}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-300">Dataset Health Score</p>
    </div>
  );
}
