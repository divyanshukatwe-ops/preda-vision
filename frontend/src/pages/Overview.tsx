import React, { useEffect, useState } from 'react';
import type { Dataset } from '../types';
import { useDatasets, formatBytes } from '../hooks/useData';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  ImageIcon,
  Camera,
  Calendar,
  HardDrive,
  CheckCircle2,
  XCircle,
  Activity,
  Upload,
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (page: 'import') => void;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const { datasets, loading, refresh } = useDatasets();
  const latestDataset = datasets[0] || null;

  // Auto-refresh while scanning
  useEffect(() => {
    if (latestDataset?.status === 'SCANNING') {
      const id = setInterval(refresh, 2000);
      return () => clearInterval(id);
    }
  }, [latestDataset?.status, refresh]);

  const hasData = latestDataset && latestDataset.status === 'COMPLETED';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Offline Wildlife Intelligence & Tiger Movement Early-Warning System
        </p>
      </div>

      {hasData ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Images Imported"
              value={latestDataset.total_images.toLocaleString()}
              icon={<ImageIcon size={20} />}
              color="amber"
            />
            <StatCard
              label="Camera Stations"
              value="-"
              icon={<Camera size={20} />}
              color="blue"
              subtitle="View in Dataset Health"
            />
            <StatCard
              label="Dataset Size"
              value={formatBytes(latestDataset.total_size_bytes)}
              icon={<HardDrive size={20} />}
              color="purple"
            />
            <StatCard
              label="Processing Status"
              value={latestDataset.status}
              icon={<Activity size={20} />}
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Valid Images"
              value={latestDataset.valid_images.toLocaleString()}
              icon={<CheckCircle2 size={20} />}
              color="emerald"
            />
            <StatCard
              label="Invalid Images"
              value={latestDataset.invalid_images.toLocaleString()}
              icon={<XCircle size={20} />}
              color="rose"
            />
            <StatCard
              label="Date Imported"
              value={latestDataset.imported_at
                ? new Date(latestDataset.imported_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : '—'}
              icon={<Calendar size={20} />}
              color="blue"
            />
          </div>

          {/* Dataset info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Imported Datasets</h3>
            <div className="space-y-3">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{ds.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ds.source_path}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {ds.total_images.toLocaleString()} images
                    </span>
                    <StatusBadge status={ds.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center mb-6">
            <Camera size={40} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Dataset Imported</h2>
          <p className="text-sm text-gray-500 max-w-md text-center mb-8">
            Import your camera-trap images to begin wildlife analysis.
            The system will scan, validate, and index all images for processing.
          </p>

          {/* Stats preview — all zeros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
            <StatCard label="Images" value="0" icon={<ImageIcon size={18} />} color="gray" />
            <StatCard label="Stations" value="0" icon={<Camera size={18} />} color="gray" />
            <StatCard label="Size" value="0 MB" icon={<HardDrive size={18} />} color="gray" />
            <StatCard label="Status" value="READY" icon={<Activity size={18} />} color="gray" />
          </div>

          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:from-amber-400 hover:to-orange-500 transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
          >
            <Upload size={18} />
            Import Camera-Trap Dataset
          </button>
        </div>
      )}
    </div>
  );
}
