import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'amber' | 'emerald' | 'rose' | 'blue' | 'purple' | 'gray';
  subtitle?: string;
}

const colorMap = {
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20 text-rose-400',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  gray: 'from-gray-500/20 to-gray-600/5 border-gray-500/20 text-gray-400',
};

const iconBg = {
  amber: 'bg-amber-500/15 text-amber-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  rose: 'bg-rose-500/15 text-rose-400',
  blue: 'bg-blue-500/15 text-blue-400',
  purple: 'bg-purple-500/15 text-purple-400',
  gray: 'bg-gray-500/15 text-gray-400',
};

export default function StatCard({ label, value, icon, color = 'amber', subtitle }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorMap[color]} p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBg[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
