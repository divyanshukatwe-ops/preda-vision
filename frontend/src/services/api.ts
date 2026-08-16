/**
 * PenchGuard AI — API Client
 */

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

import type {
  Dataset,
  DatasetHealth,
  ImportProgress,
  PaginatedImages,
  Station,
  ImageRecord,
  BlankDetectionProgress,
  SpeciesDetectionProgress,
  SpeciesSummary,
  Detection,
  IndividualTiger,
  ReIDProgress,
  TigerSightingTimeline,
  MovementSummary,
  AlertItem,
  AlertSummary,
} from '../types';

// ---- Datasets ----

export async function importDataset(sourcePath: string, name?: string) {
  return request<Dataset>('/datasets/import', {
    method: 'POST',
    body: JSON.stringify({ source_path: sourcePath, name }),
  });
}

export async function generateDemo() {
  return request<Dataset>('/datasets/demo', { method: 'POST' });
}

export async function getDatasets() {
  return request<{ datasets: Dataset[]; total: number }>('/datasets');
}

export async function getDataset(id: number) {
  return request<Dataset>(`/datasets/${id}`);
}

export async function getDatasetHealth(id: number) {
  return request<DatasetHealth>(`/datasets/${id}/health`);
}

export async function getDatasetImages(
  id: number,
  page = 1,
  pageSize = 24,
  status?: string,
  stationId?: number,
  onlyDeleted = false,
  isQuarantined?: boolean,
  isBlank?: boolean
) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (status) params.set('status', status);
  if (stationId) params.set('station_id', String(stationId));
  if (onlyDeleted) params.set('only_deleted', 'true');
  if (isQuarantined !== undefined) params.set('is_quarantined', String(isQuarantined));
  if (isBlank !== undefined) params.set('is_blank', String(isBlank));
  return request<PaginatedImages>(`/datasets/${id}/images?${params}`);
}

export async function getDatasetStations(id: number) {
  return request<Station[]>(`/datasets/${id}/stations`);
}

export async function getDatasetProgress(id: number) {
  return request<ImportProgress>(`/datasets/${id}/progress`);
}

// ---- AI Processing ----

export async function startBlankDetection(
  datasetId: number,
  confidenceThreshold = 0.80,
  autoQuarantine = false
) {
  return request<BlankDetectionProgress>('/processing/start-blank-detection', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: datasetId,
      confidence_threshold: confidenceThreshold,
      auto_quarantine: autoQuarantine,
    }),
  });
}

export async function getBlankProcessingStatus(datasetId: number) {
  return request<BlankDetectionProgress>(`/processing/status/${datasetId}`);
}

export async function quarantineImage(imageId: number) {
  return request<ImageRecord>(`/processing/quarantine/${imageId}`, { method: 'POST' });
}

export async function restoreQuarantinedImage(imageId: number) {
  return request<ImageRecord>(`/processing/restore-quarantine/${imageId}`, { method: 'POST' });
}

export async function batchQuarantine(datasetId: number, minConfidence = 0.80) {
  return request<{ dataset_id: number; quarantined_count: number }>(
    `/processing/batch-quarantine/${datasetId}?min_confidence=${minConfidence}`,
    { method: 'POST' }
  );
}

// ---- Species & Tiger Detection ----

export async function startSpeciesDetection(datasetId: number, minConfidence = 0.70) {
  return request<SpeciesDetectionProgress>(
    `/detections/start?dataset_id=${datasetId}&min_confidence=${minConfidence}`,
    { method: 'POST' }
  );
}

export async function getSpeciesDetectionStatus(datasetId: number) {
  return request<SpeciesDetectionProgress>(`/detections/status/${datasetId}`);
}

export async function getSpeciesSummary(datasetId: number) {
  return request<SpeciesSummary>(`/detections/summary/${datasetId}`);
}

export async function getImageDetections(imageId: number) {
  return request<Detection[]>(`/detections/image/${imageId}`);
}

export async function getTigerImages(datasetId: number, page = 1, pageSize = 24, species?: string) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (species) params.set('species', species);
  return request<PaginatedImages>(`/detections/tigers/${datasetId}?${params}`);
}

// ---- Individual Tiger Identification (Re-ID) ----

export async function startReIDProcess(datasetId: number) {
  return request<ReIDProgress>(`/reid/start/${datasetId}`, { method: 'POST' });
}

export async function getReIDStatus(datasetId: number) {
  return request<ReIDProgress>(`/reid/status/${datasetId}`);
}

export async function getIndividualTigers(datasetId: number) {
  return request<IndividualTiger[]>(`/reid/individuals/${datasetId}`);
}

export async function getIndividualTigerProfile(tigerId: number) {
  return request<TigerSightingTimeline>(`/reid/individual/${tigerId}`);
}

export async function getIndividualTigerImages(tigerId: number, page = 1, pageSize = 24) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return request<PaginatedImages>(`/reid/individual/${tigerId}/images?${params}`);
}

// ---- Movement & Territory Analysis ----

export async function getMovementSummary(datasetId: number) {
  return request<MovementSummary>(`/movement/summary/${datasetId}`);
}

export async function getMovementStations(datasetId: number) {
  return request<{ stations: Array<{ id: number; station_name: string; latitude: number; longitude: number; total_images: number; tiger_sightings: number }> }>(
    `/movement/stations/${datasetId}`
  );
}

// ---- Security & Threat Alerts ----

export async function generateAlerts(datasetId: number) {
  return request<AlertSummary>(`/alerts/generate/${datasetId}`, { method: 'POST' });
}

export async function getAlertsSummary(datasetId: number) {
  return request<AlertSummary>(`/alerts/summary/${datasetId}`);
}

export async function acknowledgeAlert(alertId: number) {
  return request<AlertItem>(`/alerts/acknowledge/${alertId}`, { method: 'POST' });
}

// ---- Images ----

export async function getImage(id: number) {
  return request<ImageRecord>(`/images/${id}`);
}

export async function deleteImage(id: number) {
  return request<ImageRecord>(`/images/${id}/delete`, { method: 'POST' });
}

export async function restoreImage(id: number) {
  return request<ImageRecord>(`/images/${id}/restore`, { method: 'POST' });
}

export function getThumbnailUrl(imageId: number) {
  return `${API_BASE}/images/${imageId}/thumbnail`;
}

export function getFullImageUrl(imageId: number) {
  return `${API_BASE}/images/${imageId}/full`;
}
