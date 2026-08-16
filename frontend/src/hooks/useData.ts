/**
 * PenchGuard AI — Custom React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dataset, ImportProgress } from '../types';
import * as api from '../services/api';

/**
 * Hook to poll for import progress
 */
export function useImportProgress(datasetId: number | null, enabled = true) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!datasetId || !enabled) return;

    const poll = async () => {
      try {
        const p = await api.getDatasetProgress(datasetId);
        setProgress(p);
        if (p.status === 'COMPLETED' || p.status === 'FAILED') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // Ignore transient errors during polling
      }
    };

    poll();
    intervalRef.current = window.setInterval(poll, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [datasetId, enabled]);

  return progress;
}

/**
 * Hook to fetch datasets list
 */
export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDatasets();
      setDatasets(res.datasets);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { datasets, loading, refresh };
}

/**
 * Format bytes to human-readable
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}
