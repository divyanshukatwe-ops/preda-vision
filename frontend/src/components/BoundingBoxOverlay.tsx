import React from 'react';
import type { Detection } from '../types';

interface BoundingBoxOverlayProps {
  detections: Detection[];
}

const SPECIES_COLOR_MAP: Record<string, { border: string; bg: string; text: string }> = {
  Tiger: { border: 'border-amber-500', bg: 'bg-amber-500/80', text: 'text-amber-950 font-bold' },
  Leopard: { border: 'border-yellow-400', bg: 'bg-yellow-400/80', text: 'text-yellow-950 font-bold' },
  'Sloth Bear': { border: 'border-purple-400', bg: 'bg-purple-500/80', text: 'text-white font-bold' },
  'Chital Deer': { border: 'border-emerald-400', bg: 'bg-emerald-500/80', text: 'text-white font-bold' },
  Gaur: { border: 'border-blue-400', bg: 'bg-blue-500/80', text: 'text-white font-bold' },
  Human: { border: 'border-red-400', bg: 'bg-red-500/80', text: 'text-white font-bold' },
};

export default function BoundingBoxOverlay({ detections }: BoundingBoxOverlayProps) {
  if (!detections || detections.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {detections.map((det) => {
        const style = SPECIES_COLOR_MAP[det.species_name] || {
          border: 'border-amber-400',
          bg: 'bg-amber-500/80',
          text: 'text-white font-bold',
        };

        const leftPct = `${det.bbox_x * 100}%`;
        const topPct = `${det.bbox_y * 100}%`;
        const widthPct = `${det.bbox_w * 100}%`;
        const heightPct = `${det.bbox_h * 100}%`;

        return (
          <div
            key={det.id}
            className={`absolute border-2 ${style.border} rounded transition-all duration-200`}
            style={{
              left: leftPct,
              top: topPct,
              width: widthPct,
              height: heightPct,
            }}
          >
            {/* Species Label Badge */}
            <div className="absolute -top-5 left-0">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded shadow-md ${style.bg} ${style.text} whitespace-nowrap`}
              >
                {det.species_name === 'Tiger' ? '🐯 ' : ''}
                {det.species_name} {(det.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
