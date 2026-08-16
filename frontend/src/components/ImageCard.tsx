import React, { useState } from 'react';
import type { ImageRecord } from '../types';
import { getThumbnailUrl } from '../services/api';
import StatusBadge from './StatusBadge';
import { formatTimestamp } from '../hooks/useData';
import { MapPin, Clock, Camera, Trash2, RotateCcw } from 'lucide-react';

import BoundingBoxOverlay from './BoundingBoxOverlay';

interface ImageCardProps {
  image: ImageRecord;
  onDelete?: (image: ImageRecord) => void;
  onRestore?: (image: ImageRecord) => void;
}

export default function ImageCard({ image, onDelete, onRestore }: ImageCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 relative">
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-gray-800 relative overflow-hidden">
        {!imgError ? (
          <img
            src={getThumbnailUrl(image.id)}
            alt={image.filename}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              image.is_deleted ? 'opacity-40 grayscale' : ''
            }`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Camera size={32} />
          </div>
        )}

        {/* Bounding box overlay for species detections */}
        {image.detections && image.detections.length > 0 && (
          <BoundingBoxOverlay detections={image.detections} />
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          <StatusBadge status={image.validation_status} />
        </div>

        {/* Action Button */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && !image.is_deleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image);
              }}
              title="Soft Delete Image"
              className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          {onRestore && image.is_deleted === 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(image);
              }}
              title="Retrieve / Restore Image"
              className="p-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-600 text-white backdrop-blur-sm transition-colors flex items-center gap-1 text-xs px-2"
            >
              <RotateCcw size={14} />
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-white truncate" title={image.filename}>
          {image.filename}
        </p>

        <div className="space-y-1.5">
          {image.station_name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Camera size={12} className="text-gray-500 shrink-0" />
              <span className="truncate">Station: {image.station_name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} className="text-gray-500 shrink-0" />
            <span>{formatTimestamp(image.exif_timestamp || image.filesystem_timestamp)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <MapPin size={12} className="shrink-0 text-gray-500" />
            <span className={image.latitude ? 'text-emerald-400' : 'text-gray-600'}>
              GPS: {image.latitude ? 'Available' : 'Missing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
