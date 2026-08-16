/**
 * Preda Vision — Centralized Single Source of Truth for Mock/Demo Data
 * Links real camera-trap photos for Tigers, Blank/Empty scenes, and Wildlife filler subjects.
 */

export interface DemoTiger {
  id: string; // e.g. "T-003"
  code: string; // e.g. "T-003"
  name: string; // e.g. "Mowgli Zone Female"
  gender: 'Female' | 'Male';
  sightingsCount: number; // e.g. 52
  stationsCount: number; // e.g. 11
  confidence: number; // e.g. 89
  stripeSimilarity: number; // e.g. 91
  status: 'Range Shift' | 'Active Core' | 'Buffer Entry' | 'Prolonged Absence';
  statusSeverity: 'critical' | 'warning' | 'normal';
  lastDetected: string; // e.g. "15 Aug 2026"
  firstDetected: string; // e.g. "12 Jan 2024"
  occupiedAreaKm2: number; // e.g. 42.5
  currentCameraId: string; // e.g. "ST-27"
  primaryImage: string;
  referenceImage: string;
  territoryZone: string;
  routeStations: string[]; // e.g. ["ST-07", "ST-11", "ST-15", "ST-18", "ST-27"]
  evidenceList: string[];
}

export interface DemoStation {
  id: string; // e.g. "ST-27"
  name: string; // e.g. "Sitaghat Buffer ST-27"
  latitude: number;
  longitude: number;
  zone: 'core' | 'buffer';
  status: 'normal' | 'unusual' | 'alert';
  detectionsCount: number;
  currentTigerId?: string;
  lastDetectionTime: string;
  isNewForTiger?: boolean;
}

export interface DemoAlert {
  id: string; // e.g. "ALERT-003"
  severity: 'critical' | 'warning' | 'info' | 'resolved';
  tigerId: string; // e.g. "T-003"
  type: 'NEW_STATION' | 'BUFFER_MOVEMENT' | 'RANGE_SHIFT' | 'PROLONGED_ABSENCE';
  title: string; // e.g. "New station detected"
  description: string;
  stationId: string; // e.g. "ST-27"
  timestamp: string; // e.g. "15 Aug 2026 · 06:42"
  confidence: number; // e.g. 89
  status: 'open' | 'reviewing' | 'resolved';
  evidence: string[];
  recommendedReview: string;
}

export interface DemoProcessingStats {
  totalImages: number;
  falseTriggers: number;
  tigerDetections: number;
  identifiedTigers: number;
  movementAlerts: number;
}

export interface TestSampleImage {
  id: string;
  url: string;
  type: 'TIGER' | 'BLANK' | 'WILDLIFE_FILLER';
  filename: string;
  stationId: string;
  timestamp: string;
  aiFlag: string;
  aiConfidence: number;
  aiStatus: 'QUARANTINED' | 'PASSED_TO_REID' | 'INDEXED';
  speciesLabel: string;
  notes: string;
}

// Real Photo Base Path
const BASE_URL = 'http://localhost:8000/data_images';

// SVG Fallback Images (guaranteed fallback)
export const TIGER_SVG_FALLBACK_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><path d="M150 280 C 200 150, 400 150, 450 280 Z" fill="%23d97706" opacity="0.8"/><circle cx="230" cy="220" r="14" fill="%23fef08a"/><circle cx="370" cy="220" r="14" fill="%23fef08a"/><circle cx="230" cy="220" r="6" fill="%23000"/><circle cx="370" cy="220" r="6" fill="%23000"/><path d="M 270 250 Q 300 275 330 250" stroke="%23000" stroke-width="4" fill="none"/><path d="M 180 180 L 210 210 M 230 160 L 250 200 M 370 180 L 340 210 M 350 160 L 330 200" stroke="%23000" stroke-width="6"/><text x="300" y="350" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f59e0b" text-anchor="middle">PREDA VISION — TIGER CAMERA-TRAP RECORD</text></svg>`;

export const TIGER_SVG_FALLBACK_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e1b4b"/><path d="M140 260 C 220 130, 380 130, 460 260 Z" fill="%23ea580c" opacity="0.85"/><circle cx="240" cy="210" r="12" fill="%23fef08a"/><circle cx="360" cy="210" r="12" fill="%23fef08a"/><path d="M 190 170 L 220 200 M 240 150 L 260 190 M 360 170 L 330 200 M 340 150 L 320 190" stroke="%23000" stroke-width="6"/><text x="300" y="340" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23fb923c" text-anchor="middle">STRIPE SIGNATURE RE-ID PROFILE</text></svg>`;

// Centralized Tigers Linked to Real Camera-Trap Images
export const DEMO_TIGERS: DemoTiger[] = [
  {
    id: 'T-003',
    code: 'T-003',
    name: 'Mowgli Zone Female (T-003)',
    gender: 'Female',
    sightingsCount: 52,
    stationsCount: 11,
    confidence: 89,
    stripeSimilarity: 91,
    status: 'Range Shift',
    statusSeverity: 'critical',
    lastDetected: '15 Aug 2026',
    firstDetected: '12 Jan 2024',
    occupiedAreaKm2: 42.5,
    currentCameraId: 'ST-27',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_153/000105.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_153/000187.jpg`,
    territoryZone: 'Mowgli & Sitaghat Buffer Corridor',
    routeStations: ['ST-07', 'ST-11', 'ST-15', 'ST-18', 'ST-27'],
    evidenceList: [
      'ST-27 was not previously used by T-003',
      'Detection occurred outside established activity area',
      'Supporting flank stripe detection verified (91% similarity)',
      'Camera station ST-27 is active in Buffer Zone'
    ]
  },
  {
    id: 'T-001',
    code: 'T-001',
    name: 'Collarwali Lineage (T-001)',
    gender: 'Female',
    sightingsCount: 68,
    stationsCount: 14,
    confidence: 94,
    stripeSimilarity: 96,
    status: 'Active Core',
    statusSeverity: 'normal',
    lastDetected: '16 Aug 2026',
    firstDetected: '04 Mar 2023',
    occupiedAreaKm2: 58.2,
    currentCameraId: 'ST-01',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_160/000100.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_160/000232.jpg`,
    territoryZone: 'Turia Core Range',
    routeStations: ['ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05'],
    evidenceList: [
      'Frequent captures across Turia Core stations',
      'High flank match consistency (96%)',
      'Established territory centroid unchanged'
    ]
  },
  {
    id: 'T-002',
    code: 'T-002',
    name: 'Raiyyakasa Male (T-002)',
    gender: 'Male',
    sightingsCount: 44,
    stationsCount: 9,
    confidence: 91,
    stripeSimilarity: 93,
    status: 'Buffer Entry',
    statusSeverity: 'warning',
    lastDetected: '14 Aug 2026',
    firstDetected: '18 Nov 2023',
    occupiedAreaKm2: 64.1,
    currentCameraId: 'ST-12',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_154/000014.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_154/000212.jpg`,
    territoryZone: 'Karmajhiri & Raiyyakasa River',
    routeStations: ['ST-08', 'ST-09', 'ST-10', 'ST-12'],
    evidenceList: [
      'Movement along Raiyyakasa riverbank corridor',
      'Temporary entry into buffer station ST-12'
    ]
  },
  {
    id: 'T-004',
    code: 'T-004',
    name: 'Chhindwara Border Male (T-004)',
    gender: 'Male',
    sightingsCount: 39,
    stationsCount: 8,
    confidence: 87,
    stripeSimilarity: 88,
    status: 'Active Core',
    statusSeverity: 'normal',
    lastDetected: '13 Aug 2026',
    firstDetected: '02 Jun 2024',
    occupiedAreaKm2: 51.0,
    currentCameraId: 'ST-19',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_246/000009.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_246/000195.jpg`,
    territoryZone: 'Northern Pench Sanctuary',
    routeStations: ['ST-17', 'ST-19', 'ST-20'],
    evidenceList: [
      'Dominant male territorial boundary patrolled'
    ]
  },
  {
    id: 'T-005',
    code: 'T-005',
    name: 'Telia Dam Female (T-005)',
    gender: 'Female',
    sightingsCount: 31,
    stationsCount: 6,
    confidence: 85,
    stripeSimilarity: 87,
    status: 'Prolonged Absence',
    statusSeverity: 'warning',
    lastDetected: '28 Jul 2026',
    firstDetected: '10 Oct 2024',
    occupiedAreaKm2: 36.4,
    currentCameraId: 'ST-22',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_243/000173.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_243/000179.jpg`,
    territoryZone: 'Telia Lake & Bichhia Nalla',
    routeStations: ['ST-21', 'ST-22', 'ST-23'],
    evidenceList: [
      'No camera captures recorded for > 18 days',
      'Last recorded at ST-22 Telia Lake'
    ]
  },
  {
    id: 'T-006',
    code: 'T-006',
    name: 'Gumtara Male (T-006)',
    gender: 'Male',
    sightingsCount: 27,
    stationsCount: 5,
    confidence: 88,
    stripeSimilarity: 90,
    status: 'Buffer Entry',
    statusSeverity: 'warning',
    lastDetected: '11 Aug 2026',
    firstDetected: '15 Jan 2025',
    occupiedAreaKm2: 48.0,
    currentCameraId: 'ST-26',
    primaryImage: `${BASE_URL}/raw/individual_tiger/tiger_136/000438.jpg`,
    referenceImage: `${BASE_URL}/raw/individual_tiger/tiger_136/000568.jpg`,
    territoryZone: 'Gumtara Buffer Corridor',
    routeStations: ['ST-24', 'ST-25', 'ST-26'],
    evidenceList: [
      'Active buffer zone transit'
    ]
  }
];

// Test Suite Sample Images (Real Tigers, Blanks, & Wildlife Fillers)
export const TEST_SAMPLE_IMAGES: TestSampleImage[] = [
  {
    id: 'SAMPLE-001',
    url: `${BASE_URL}/raw/tiger/000024.jpg`,
    type: 'TIGER',
    filename: '000024.jpg',
    stationId: 'ST-07',
    timestamp: '15 Aug 2026 · 14:10',
    aiFlag: 'SPECIES_TIGER_CONFIRMED',
    aiConfidence: 98.6,
    aiStatus: 'PASSED_TO_REID',
    speciesLabel: 'Panthera tigris (Amur Tiger)',
    notes: 'Clear flank stripe pattern detected; passed to Re-ID matching engine.'
  },
  {
    id: 'SAMPLE-002',
    url: `${BASE_URL}/raw/blank/5862938a-23d2-11e8-a6a3-ec086b02610b.jpg`,
    type: 'BLANK',
    filename: 'blank_001.jpg',
    stationId: 'ST-18',
    timestamp: '15 Aug 2026 · 12:45',
    aiFlag: 'BLANK_FALSE_TRIGGER',
    aiConfidence: 97.4,
    aiStatus: 'QUARANTINED',
    speciesLabel: 'Empty Scene (Wind / Foliage Motion)',
    notes: 'FLAGGED AS BLANK: No animal subject detected; automatically isolated to quarantine bin.'
  },
  {
    id: 'SAMPLE-003',
    url: `${BASE_URL}/raw/wildlife/5858bf8e-23d2-11e8-a6a3-ec086b02610b.jpg`,
    type: 'WILDLIFE_FILLER',
    filename: 'wildlife_001.jpg',
    stationId: 'ST-11',
    timestamp: '15 Aug 2026 · 10:15',
    aiFlag: 'SPECIES_DEER_DETECTED',
    aiConfidence: 94.2,
    aiStatus: 'INDEXED',
    speciesLabel: 'Chital Deer (Axis axis)',
    notes: 'FILLER SUBJECT: Non-tiger wildlife detected; indexed for species diversity census.'
  },
  {
    id: 'SAMPLE-004',
    url: `${BASE_URL}/raw/blank/58643506-23d2-11e8-a6a3-ec086b02610b.jpg`,
    type: 'BLANK',
    filename: 'blank_002.jpg',
    stationId: 'ST-27',
    timestamp: '15 Aug 2026 · 06:12',
    aiFlag: 'BLANK_FALSE_TRIGGER',
    aiConfidence: 96.1,
    aiStatus: 'QUARANTINED',
    speciesLabel: 'Empty Scene (Shadow / Light Shift)',
    notes: 'FLAGGED AS BLANK: Camera triggered by morning sunlight glare; quarantined.'
  },
  {
    id: 'SAMPLE-005',
    url: `${BASE_URL}/raw/tiger/000094.jpg`,
    type: 'TIGER',
    filename: '000094.jpg',
    stationId: 'ST-27',
    timestamp: '15 Aug 2026 · 06:42',
    aiFlag: 'SPECIES_TIGER_CONFIRMED',
    aiConfidence: 97.9,
    aiStatus: 'PASSED_TO_REID',
    speciesLabel: 'Panthera tigris (Amur Tiger)',
    notes: 'FLAGGED AS TIGER: Critical buffer breach at ST-27; matched to T-003.'
  },
  {
    id: 'SAMPLE-006',
    url: `${BASE_URL}/raw/wildlife/5858c111-23d2-11e8-a6a3-ec086b02610b.jpg`,
    type: 'WILDLIFE_FILLER',
    filename: 'wildlife_002.jpg',
    stationId: 'ST-12',
    timestamp: '14 Aug 2026 · 18:20',
    aiFlag: 'SPECIES_COYOTE_DETECTED',
    aiConfidence: 92.8,
    aiStatus: 'INDEXED',
    speciesLabel: 'Coyote / Canid Subject',
    notes: 'FILLER SUBJECT: Non-tiger predator detected; indexed to wildlife survey database.'
  }
];

// Centralized Pench Camera Stations (around 21.73° N, 79.31° E)
export const DEMO_STATIONS: DemoStation[] = [
  { id: 'ST-01', name: 'Turia Gate Core ST-01', latitude: 21.745, longitude: 79.305, zone: 'core', status: 'normal', detectionsCount: 142, currentTigerId: 'T-001', lastDetectionTime: '16 Aug · 08:15' },
  { id: 'ST-02', name: 'Karmajhiri Core ST-02', latitude: 21.758, longitude: 79.318, zone: 'core', status: 'normal', detectionsCount: 118, currentTigerId: 'T-001', lastDetectionTime: '16 Aug · 04:22' },
  { id: 'ST-03', name: 'Alikatta Core ST-03', latitude: 21.732, longitude: 79.332, zone: 'core', status: 'normal', detectionsCount: 95, currentTigerId: 'T-001', lastDetectionTime: '15 Aug · 22:10' },
  { id: 'ST-04', name: 'Pyorthadi Core ST-04', latitude: 21.721, longitude: 79.315, zone: 'core', status: 'normal', detectionsCount: 84, lastDetectionTime: '15 Aug · 19:45' },
  { id: 'ST-05', name: 'Chhindimatta Core ST-05', latitude: 21.705, longitude: 79.298, zone: 'core', status: 'normal', detectionsCount: 76, lastDetectionTime: '14 Aug · 23:05' },

  { id: 'ST-07', name: 'Sitaghat Core ST-07', latitude: 21.765, longitude: 79.345, zone: 'core', status: 'normal', detectionsCount: 165, currentTigerId: 'T-003', lastDetectionTime: '14 Aug · 14:10' },
  { id: 'ST-11', name: 'Mowgli Pathway ST-11', latitude: 21.780, longitude: 79.360, zone: 'core', status: 'normal', detectionsCount: 132, currentTigerId: 'T-003', lastDetectionTime: '14 Aug · 18:30' },
  { id: 'ST-15', name: 'Nala Transit ST-15', latitude: 21.795, longitude: 79.375, zone: 'core', status: 'unusual', detectionsCount: 98, currentTigerId: 'T-003', lastDetectionTime: '14 Aug · 23:50' },
  { id: 'ST-18', name: 'Sanctuary Boundary ST-18', latitude: 21.810, longitude: 79.390, zone: 'buffer', status: 'unusual', detectionsCount: 87, currentTigerId: 'T-003', lastDetectionTime: '15 Aug · 02:15' },
  { id: 'ST-27', name: 'Buffer Extension ST-27', latitude: 21.825, longitude: 79.405, zone: 'buffer', status: 'alert', detectionsCount: 52, currentTigerId: 'T-003', lastDetectionTime: '15 Aug · 06:42', isNewForTiger: true },

  { id: 'ST-08', name: 'Raiyyakasa River ST-08', latitude: 21.710, longitude: 79.355, zone: 'core', status: 'normal', detectionsCount: 110, currentTigerId: 'T-002', lastDetectionTime: '14 Aug · 11:20' },
  { id: 'ST-12', name: 'Raiyyakasa Buffer ST-12', latitude: 21.695, longitude: 79.370, zone: 'buffer', status: 'unusual', detectionsCount: 64, currentTigerId: 'T-002', lastDetectionTime: '14 Aug · 16:40' },

  { id: 'ST-19', name: 'Northern Border ST-19', latitude: 21.830, longitude: 79.325, zone: 'core', status: 'normal', detectionsCount: 78, currentTigerId: 'T-004', lastDetectionTime: '13 Aug · 21:00' },
  { id: 'ST-22', name: 'Telia Lake ST-22', latitude: 21.680, longitude: 79.310, zone: 'buffer', status: 'unusual', detectionsCount: 42, currentTigerId: 'T-005', lastDetectionTime: '28 Jul · 14:15' },
  { id: 'ST-26', name: 'Gumtara Buffer ST-26', latitude: 21.665, longitude: 79.280, zone: 'buffer', status: 'unusual', detectionsCount: 55, currentTigerId: 'T-006', lastDetectionTime: '11 Aug · 09:30' }
];

// Centralized Alerts
export const DEMO_ALERTS: DemoAlert[] = [
  {
    id: 'ALERT-003',
    severity: 'critical',
    tigerId: 'T-003',
    type: 'NEW_STATION',
    title: 'New station detected',
    description: 'Tiger T-003 recorded at camera station ST-27 for the first time outside its historical core range.',
    stationId: 'ST-27',
    timestamp: '15 Aug 2026 · 06:42',
    confidence: 89,
    status: 'open',
    evidence: [
      'ST-27 was not previously used by T-003',
      'Detection occurred outside established activity area (42.5 km² centroid shift)',
      'Supporting flank match score 91% verified',
      'Camera station ST-27 is active in Buffer Zone'
    ],
    recommendedReview: 'Inspect ST-27 and nearby buffer stations.'
  },
  {
    id: 'ALERT-001',
    severity: 'warning',
    tigerId: 'T-003',
    type: 'RANGE_SHIFT',
    title: 'Range Shift Detected',
    description: 'T-003 activity center shifted +8.4 km northeast toward Pench-Satpura buffer corridor.',
    stationId: 'ST-18',
    timestamp: '15 Aug 2026 · 02:15',
    confidence: 91,
    status: 'open',
    evidence: [
      'Activity center moved +8.4 km beyond historical home range',
      'Accelerated transit speed detected between ST-15 and ST-18'
    ],
    recommendedReview: 'Review range shift boundary sensors and deployment health.'
  },
  {
    id: 'ALERT-002',
    severity: 'warning',
    tigerId: 'T-002',
    type: 'BUFFER_MOVEMENT',
    title: 'Buffer Zone Movement',
    description: 'Raiyyakasa Male T-002 entered buffer camera station ST-12.',
    stationId: 'ST-12',
    timestamp: '14 Aug 2026 · 16:40',
    confidence: 93,
    status: 'reviewing',
    evidence: [
      'ST-12 station located in southern buffer corridor',
      'T-002 tiger verified with 93% match confidence'
    ],
    recommendedReview: 'Monitor ST-12 station for territorial conflict.'
  },
  {
    id: 'ALERT-004',
    severity: 'warning',
    tigerId: 'T-005',
    type: 'PROLONGED_ABSENCE',
    title: 'Prolonged Absence Alert',
    description: 'Telia Dam Female T-005 has no recorded detections for over 18 days (threshold: 7 days).',
    stationId: 'ST-22',
    timestamp: '28 Jul 2026 · 14:15',
    confidence: 85,
    status: 'open',
    evidence: [
      'No camera captures recorded since 28 July 2026',
      'Exceeds 7-day alert notification threshold'
    ],
    recommendedReview: 'Dispatch field ranger patrol to Telia Lake ST-22.'
  },
  {
    id: 'ALERT-005',
    severity: 'info',
    tigerId: 'T-006',
    type: 'BUFFER_MOVEMENT',
    title: 'Gumtara Buffer Transit',
    description: 'T-006 recorded traversing Gumtara buffer corridor station ST-26.',
    stationId: 'ST-26',
    timestamp: '11 Aug 2026 · 09:30',
    confidence: 88,
    status: 'resolved',
    evidence: [
      'Routine buffer transit',
      'Normal velocity vector'
    ],
    recommendedReview: 'Standard record logging completed.'
  }
];

export const DEMO_PROCESSING_FINAL_STATS: DemoProcessingStats = {
  totalImages: 10428,
  falseTriggers: 7842,
  tigerDetections: 640,
  identifiedTigers: 587,
  movementAlerts: 5
};
