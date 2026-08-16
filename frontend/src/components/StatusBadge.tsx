import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  VALID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INVALID: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CORRUPT: 'bg-red-500/15 text-red-400 border-red-500/30',
  UNKNOWN: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SCANNING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PENDING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
  'READY FOR IMPORT': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.UNKNOWN;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wider ${style} ${sizeClass}`}>
      {status}
    </span>
  );
}
