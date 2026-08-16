import React, { useState, useRef } from 'react';
import type { Dataset, ImportProgress, ImageRecord, PaginatedImages } from '../types';
import { useImportProgress } from '../hooks/useData';
import ProgressBar from '../components/ProgressBar';
import ImageCard from '../components/ImageCard';
import * as api from '../services/api';
import {
  FolderOpen,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FolderSearch,
  X,
  Check,
  Folder,
  Layers,
} from 'lucide-react';

interface PresetFolder {
  name: string;
  path: string;
  description: string;
  icon: string;
  badge: string;
}

const PRESET_FOLDERS: PresetFolder[] = [
  {
    name: 'Amur Tiger Camera-Trap Dataset',
    path: 'preda_vision_data/raw/tiger',
    description: '320 genuine tiger camera-trap images (LILA BC / ATRW)',
    icon: '🐯',
    badge: 'Tiger Detection',
  },
  {
    name: 'Individual Tiger Re-ID Dataset',
    path: 'preda_vision_data/raw/individual_tiger',
    description: '371 flank captures across 6 cataloged tigers (T-153, T-160, etc.)',
    icon: '🐯',
    badge: 'Re-ID Registry',
  },
  {
    name: 'Empty / Blank Camera-Traps',
    path: 'preda_vision_data/raw/blank',
    description: '250 empty frames for false-trigger filtering (CCT20)',
    icon: '🍃',
    badge: 'Blank Filtering',
  },
  {
    name: 'Multi-Species Wildlife Dataset',
    path: 'preda_vision_data/raw/wildlife',
    description: '600 animal captures (deer, coyote, raccoon, bobcat, bird)',
    icon: '🦌',
    badge: 'Species AI',
  },
  {
    name: 'Pench Reserve Synthetic Station Data',
    path: 'data/demo_dataset',
    description: '600 images across 10 camera stations (CAM_001 – CAM_010)',
    icon: '📸',
    badge: 'Pench Demo',
  },
];

export default function ImportDataset() {
  const [folderPath, setFolderPath] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [importing, setImporting] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<PaginatedImages | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [viewDeleted, setViewDeleted] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const progress = useImportProgress(activeDataset?.id ?? null, importing || generatingDemo);

  // When scan completes, fetch preview
  React.useEffect(() => {
    if (progress?.status === 'COMPLETED' && activeDataset) {
      setImporting(false);
      setGeneratingDemo(false);
      loadPreview(activeDataset.id, 1, viewDeleted);
    }
    if (progress?.status === 'FAILED') {
      setImporting(false);
      setGeneratingDemo(false);
      setError('Scan failed. Check the backend logs for details.');
    }
  }, [progress?.status, viewDeleted]);

  const loadPreview = async (datasetId: number, page: number, onlyDeleted = false) => {
    try {
      const res = await api.getDatasetImages(datasetId, page, 12, undefined, undefined, onlyDeleted);
      setPreviewImages(res);
      setPreviewPage(page);
    } catch {
      // silent
    }
  };

  const handleDeleteImage = async (img: ImageRecord) => {
    if (!activeDataset) return;
    try {
      await api.deleteImage(img.id);
      loadPreview(activeDataset.id, previewPage, viewDeleted);
    } catch (e: any) {
      setError(e.message || 'Failed to soft delete image');
    }
  };

  const handleRestoreImage = async (img: ImageRecord) => {
    if (!activeDataset) return;
    try {
      await api.restoreImage(img.id);
      loadPreview(activeDataset.id, previewPage, viewDeleted);
    } catch (e: any) {
      setError(e.message || 'Failed to restore image');
    }
  };

  const handleImport = async () => {
    if (!folderPath.trim()) {
      setError('Please select or enter a folder path.');
      return;
    }
    setError(null);
    setImporting(true);
    setPreviewImages(null);
    try {
      const ds = await api.importDataset(folderPath.trim(), datasetName || undefined);
      setActiveDataset(ds);
    } catch (e: any) {
      setError(e.message || 'Import failed');
      setImporting(false);
    }
  };

  const handleGenerateDemo = async () => {
    setError(null);
    setGeneratingDemo(true);
    setPreviewImages(null);
    setFolderPath('');
    try {
      const ds = await api.generateDemo();
      setActiveDataset(ds);
    } catch (e: any) {
      setError(e.message || 'Demo generation failed');
      setGeneratingDemo(false);
    }
  };

  // Trigger HTML5 Folder Picker dialog
  const handleNativeBrowseClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Handle selected folder from native browser window
  const handleNativeFolderSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      // Extract relative path or directory name
      let dirPath = '';
      if ('webkitRelativePath' in firstFile && firstFile.webkitRelativePath) {
        const parts = firstFile.webkitRelativePath.split('/');
        dirPath = parts[0];
      } else {
        dirPath = firstFile.name;
      }
      setFolderPath(dirPath);
      if (!datasetName) {
        setDatasetName(dirPath.replace(/[_-]/g, ' '));
      }
      setShowFolderModal(false);
    }
  };

  const handleSelectPreset = (preset: PresetFolder) => {
    setFolderPath(preset.path);
    setDatasetName(preset.name);
    setShowFolderModal(false);
  };

  const isProcessing = importing || generatingDemo;
  const isDone = progress?.status === 'COMPLETED';

  return (
    <div className="space-y-8">
      {/* Hidden HTML5 Folder Picker */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleNativeFolderSelected}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Import Dataset</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a local folder containing raw camera-trap images
        </p>
      </div>

      {/* Import Form */}
      {!isProcessing && !isDone && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dataset Folder Path
            </label>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="Select a folder or enter path e.g. preda_vision_data/raw/tiger"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              {/* POPUP BROWSER WINDOW TRIGGER BUTTON */}
              <button
                type="button"
                onClick={() => setShowFolderModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/25 transition-all shadow-sm"
              >
                <FolderSearch size={18} />
                <span>Browse Folders...</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dataset Name <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="Pench Cycle 07 — August 2026"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleImport}
              disabled={!folderPath.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:from-amber-400 hover:to-orange-500 transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-amber-500 disabled:hover:to-orange-600"
            >
              <Upload size={18} />
              Import Dataset
            </button>

            <div className="h-8 w-px bg-gray-700" />

            <button
              onClick={handleGenerateDemo}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 font-medium text-sm hover:bg-gray-700 hover:text-white transition-all duration-200"
            >
              <Sparkles size={16} />
              Generate Demo Dataset
            </button>
          </div>

          <p className="text-xs text-gray-600">
            Supported formats: JPG, JPEG, PNG, WEBP · Original files are never modified
          </p>
        </div>
      )}

      {/* POPUP FOLDER SELECTION MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowFolderModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderSearch className="text-amber-400" size={22} />
                Select Dataset Folder Window
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Choose a local camera-trap directory or open your system file browser
              </p>
            </div>

            {/* Native Explorer Folder Open Button */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <FolderOpen size={16} />
                  System Explorer Folder Window
                </h3>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Open Windows File Explorer folder picker popup window
                </p>
              </div>

              <button
                type="button"
                onClick={handleNativeBrowseClick}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
              >
                Open Explorer Popup
              </button>
            </div>

            {/* Quick-Preset Local Folders */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Preda Vision Local Data Repositories
              </label>

              <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {PRESET_FOLDERS.map((preset) => (
                  <div
                    key={preset.path}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/80 hover:border-amber-500/50 hover:bg-gray-800 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                            {preset.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-700 text-gray-300 font-semibold border border-gray-600">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{preset.path}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{preset.description}</p>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {isProcessing && progress && (
        <div className="space-y-4">
          {generatingDemo && progress.percent < 5 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <Loader2 size={18} className="text-amber-400 animate-spin" />
              <p className="text-sm text-amber-300">
                Generating demo dataset — creating synthetic camera-trap images...
              </p>
            </div>
          )}
          <ProgressBar
            percent={progress.percent}
            scanned={progress.scanned_files}
            total={progress.total_files}
            currentFile={progress.current_file}
            status={progress.status}
          />
        </div>
      )}

      {/* Completion + Preview */}
      {isDone && activeDataset && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-300">
                Dataset imported successfully
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {progress?.scanned_files.toLocaleString()} images scanned ·{' '}
                {progress?.errors || 0} errors
              </p>
            </div>
          </div>

          {/* Image Preview Gallery & Trash Management */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setViewDeleted(false);
                    loadPreview(activeDataset.id, 1, false);
                  }}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    !viewDeleted
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Active Images
                </button>
                <button
                  onClick={() => {
                    setViewDeleted(true);
                    loadPreview(activeDataset.id, 1, true);
                  }}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    viewDeleted
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Recycling Bin / Deleted Images
                </button>
              </div>
              {previewImages && (
                <span className="text-xs text-gray-500">
                  {previewImages.total.toLocaleString()} {viewDeleted ? 'deleted' : 'active'} images
                </span>
              )}
            </div>

            {previewImages && previewImages.images.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {previewImages.images.map((img) => (
                    <ImageCard
                      key={img.id}
                      image={img}
                      onDelete={handleDeleteImage}
                      onRestore={handleRestoreImage}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {previewImages.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => loadPreview(activeDataset.id, previewPage - 1, viewDeleted)}
                      disabled={previewPage <= 1}
                      className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {previewPage} of {previewImages.total_pages}
                    </span>
                    <button
                      onClick={() => loadPreview(activeDataset.id, previewPage + 1, viewDeleted)}
                      disabled={previewPage >= previewImages.total_pages}
                      className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 text-sm">
                {viewDeleted
                  ? 'No deleted images in recycling bin.'
                  : 'No active images found.'}
              </div>
            )}
          </div>

          {/* Import another */}
          <button
            onClick={() => {
              setActiveDataset(null);
              setPreviewImages(null);
              setFolderPath('');
              setDatasetName('');
              setViewDeleted(false);
            }}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Import another dataset
          </button>
        </div>
      )}
    </div>
  );
}
