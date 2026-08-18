# Preda Vision AI

**Offline Wildlife Intelligence & Tiger Movement Early-Warning System**

A production-quality camera-trap data ingestion and analysis platform for the Pench Tiger Reserve. This is Step 1: Foundation + Data Ingestion Layer.

---

## Features (Step 1)

- **Dataset Import**: Select any local folder of camera-trap images (JPG, JPEG, PNG, WEBP)
- **Recursive Scanning**: Discovers all images in nested folder structures
- **Metadata Extraction**: EXIF timestamps, GPS coordinates, image dimensions
- **Station Detection**: Infers camera stations from directory structure
- **Dataset Health**: Transparent quality scoring with metric breakdowns
- **Image Preview**: Paginated gallery with thumbnails
- **Real-time Progress**: Live scan progress tracking
- **Demo Dataset**: Built-in generator for demonstration
- **Safety**: Original images are NEVER modified or moved
- **Offline-First**: Works without internet on a normal laptop

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** (with npm)

---

## Installation

### 1. Backend Setup

```bash
# From project root
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt piexif
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

---

## Running the Application

Open **two terminals** from the project root:

### Terminal 1 — Backend (Single Command)

```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```
*(On macOS/Linux: `./venv/bin/python -m uvicorn backend.main:app --reload --port 8000`)*

### Terminal 2 — Frontend (Single Command)

```powershell
npm run dev
```

> **Note for Windows PowerShell Users:** If PowerShell script execution is restricted on your machine, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, or run `cmd /c "npm run dev"`.

Then open **http://localhost:5173** in your browser.

---

## Quick Start Demo

1. Launch both backend and frontend (see above)
2. Navigate to **Import Dataset** in the sidebar
3. Click **Generate Demo Dataset** — this creates ~600 synthetic camera-trap images
4. Watch the real-time scan progress
5. View the **Overview** dashboard for statistics
6. Check **Dataset Health** for quality analysis
7. Browse the image gallery in the import completion view

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/datasets/import` | Import a dataset from a local folder |
| `POST` | `/api/datasets/demo` | Generate and import a demo dataset |
| `GET` | `/api/datasets` | List all datasets |
| `GET` | `/api/datasets/{id}` | Get dataset details |
| `GET` | `/api/datasets/{id}/health` | Get health report |
| `GET` | `/api/datasets/{id}/images` | Paginated image list |
| `GET` | `/api/datasets/{id}/stations` | Station list |
| `GET` | `/api/datasets/{id}/progress` | Scan progress |
| `GET` | `/api/images/{id}` | Image metadata |
| `GET` | `/api/images/{id}/thumbnail` | Serve thumbnail |
| `GET` | `/api/images/{id}/full` | Serve full image |

---

## Project Structure

```
├── backend/
│   ├── api/
│   │   ├── datasets.py         # Dataset CRUD + import endpoints
│   │   └── images.py           # Image endpoints + thumbnails
│   ├── models/
│   │   ├── database.py         # SQLAlchemy ORM models + engine
│   │   └── schemas.py          # Pydantic response schemas
│   ├── services/
│   │   ├── dataset_scanner.py  # Core scanning engine
│   │   ├── metadata_extractor.py # EXIF / GPS / dimension extraction
│   │   ├── station_detector.py # Camera station inference
│   │   ├── health_analyzer.py  # Quality scoring
│   │   └── demo_generator.py   # Synthetic dataset generator
│   ├── utils/
│   │   └── helpers.py
│   ├── main.py                 # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, StatCard, StatusBadge, etc.
│   │   ├── pages/              # Overview, ImportDataset, DatasetHealth
│   │   ├── services/           # API client
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/              # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── data/                       # Runtime data (auto-created)
│   ├── originals/
│   ├── quarantine/             # Future: blank-image staging
│   ├── processed/
│   │   └── thumbnails/
│   ├── exports/
│   └── database/
│       └── penchguard.db       # SQLite database
└── README.md
```

---

## Architecture Notes

The backend is designed for extensibility. Future AI modules plug in as new service files:

```
backend/services/
├── blank_detector.py       # (Step 2)
├── tiger_detector.py       # (Step 3)
├── tiger_identifier.py     # (Step 4)
├── movement_engine.py      # (Step 5)
└── alert_engine.py         # (Step 6)
```

The database schema supports additional tables (detections, tiger IDs, movement events, alerts) without breaking existing tables.

---

## License

Built for the Pench Tiger Reserve Hackathon.
