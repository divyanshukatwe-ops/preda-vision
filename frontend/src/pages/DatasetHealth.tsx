import React, { useEffect, useState } from 'react';
import type { Dataset, DatasetHealth as DatasetHealthType, Station } from '../types';
import { useDatasets, formatBytes } from '../hooks/useData';
import HealthGauge from '../components/HealthGauge';
import StatusBadge from '../components/StatusBadge';
import * as api from '../services/api';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Copy,
  Camera,
  BarChart3,
} from 'lucide-react';

export default function DatasetHealthPage() {
  const { datasets, loading } = useDatasets();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [health, setHealth] = useState<DatasetHealthType | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const completedDatasets = datasets.filter((d) => d.status === 'COMPLETED');

  useEffect(() => {
    if (!selectedId && completedDatasets.length > 0) {
      setSelectedId(completedDatasets[0].id);
    }
  }, [completedDatasets]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingHealth(true);
    Promise.all([api.getDatasetHealth(selectedId), api.getDatasetStations(selectedId)])
      .then(([h, s]) => {
        setHealth(h);
        setStations(s);
      })
      .catch(() => {})
      .finally(() => setLoadingHealth(false));
  }, [selectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (completedDatasets.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dataset Health</h1>
          <p className="text-sm text-gray-500 mt-1">Quality analysis of imported datasets</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 size={48} className="text-gray-700 mb-4" />
          <p className="text-gray-500">No completed datasets to analyze.</p>
          <p className="text-xs text-gray-600 mt-1">Import a dataset first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dataset Health</h1>
          <p className="text-sm text-gray-500 mt-1">Quality analysis of imported datasets</p>
        </div>

        {completedDatasets.length > 1 && (
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50"
          >
            {completedDatasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingHealth ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : health ? (
        <>
          {/* Health Score + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gauge */}
            <div className="rounded-xl border border-border bg-card p-8 flex items-center justify-center">
              <HealthGauge score={health.health_score} />
            </div>

            {/* Key Stats */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Dataset Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricBox
                  icon={<CheckCircle2 size={16} />}
                  label="Total Images"
                  value={health.total_images.toLocaleString()}
                  color="text-white"
                />
                <MetricBox
                  icon={<CheckCircle2 size={16} />}
                  label="Valid"
                  value={health.valid_images.toLocaleString()}
                  color="text-emerald-400"
                />
                <MetricBox
                  icon={<XCircle size={16} />}
                  label="Invalid"
                  value={health.invalid_images.toLocaleString()}
                  color="text-rose-400"
                />
                <MetricBox
                  icon={<AlertTriangle size={16} />}
                  label="Corrupted"
                  value={health.corrupt_images.toLocaleString()}
                  color="text-red-400"
                />
                <MetricBox
                  icon={<Camera size={16} />}
                  label="Stations"
                  value={health.stations_count.toLocaleString()}
                  color="text-blue-400"
                />
                <MetricBox
                  icon={<Copy size={16} />}
                  label="Duplicates"
                  value={health.duplicate_candidates.toLocaleString()}
                  color="text-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Metric Bars */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Health Metrics</h3>
            <div className="space-y-5">
              {health.metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300">{m.label}</span>
                    <div className="flex items-center gap-2">
                      {m.total != null && (
                        <span className="text-xs text-gray-500">
                          {m.value.toLocaleString()} / {m.total.toLocaleString()}
                        </span>
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          m.status === 'green'
                            ? 'text-emerald-400'
                            : m.status === 'yellow'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {m.percent != null ? `${m.percent}%` : m.value}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        m.status === 'green'
                          ? 'bg-emerald-500'
                          : m.status === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(m.percent ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stations Table */}
          {stations.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Camera Stations ({stations.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Station
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Images
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GPS
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Folder
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="text-white font-medium">{s.station_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">
                          {s.image_count.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {s.latitude && s.longitude ? (
                            <span className="text-emerald-400 text-xs">
                              {s.latitude.toFixed(4)}°, {s.longitude.toFixed(4)}°
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{s.source_folder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function MetricBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-800">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
