# Integrated Wheat Yield Forecasting

UAV (drone) remote-sensing based crop intelligence platform combining **yield forecasting** and **early disease detection**. Survey zones with multi-spectral vegetation indices (NDVI, GNDVI, NDRE, LAI, canopy cover) to generate per-zone yield forecasts, then fuse soil properties with UAV multispectral reflectance to score disease risk for six wheat diseases — all in a single 4-tab dashboard.

## Features

### 1. Yield Forecast tab
- **Zone management** — define agricultural zones (crop type, area, soil type, variety, GPS, sowing date)
- **UAV survey entry** — record per-date readings: NDVI, GNDVI, NDRE, LAI, canopy cover (%), optional raw multispectral bands (blue/green/red/red-edge/NIR) and canopy temperature
- **Forecast models** (switchable, live recalculation):
  - **MVHS** — Multi-Index Vegetation Health Score with weighted indices + crop-specific yield response curves
  - **NDVI Regression** — linear NDVI→yield regression with crop-specific slopes
  - **Ensemble** — 55/45 blend of the two above (default), with agreement/confidence estimation
- **Stress detection & health grading** — flags index anomalies (nutrient stress, water stress, canopy gaps)
- **Visual analytics** — forecast bar chart with confidence intervals, seasonal NDVI trend lines, per-zone detail dialogs

### 2. Disease Monitoring tab
- **Knowledge-based fusion engine** — scores six wheat diseases (Yellow Rust, Brown Rust, Powdery Mildew, Fusarium Head Blight, Septoria Tritici Blotch, Tan Spot) by fusing soil samples with UAV signals
- **Risk levels** — low / moderate / high / severe per disease with confidence estimates and full "why" explanations
- **Threshold-triggered alerts** — high/severe findings raise alerts carrying agronomic recommendations; acknowledge individually or all at once
- **Dashboard analytics** — KPI cards, risk-level donut, disease-threat distribution, per-zone fused risk cards
- **Zone detail dialog** — per-disease soil/UAV contribution breakdown, soil sample history, per-zone alert management

### 3. Detection Lab tab
- **Interactive fusion sandbox** — adjust soil properties (pH, N, P, K, OM, moisture, temperature, EC) and multispectral bands (blue, green, red, red-edge, NIR, canopy temp) and see how disease risk responds
- **Instant preview** — all six diseases scored in the browser (charts: stacked soil-vs-UAV contributions, risk radar, detailed results)
- **Save & persist** — write the soil sample to the zone and persist a detection batch

### 4. Knowledge Base tab
- **How the fusion engine works** — the full pipeline explainer
- **Per-disease knowledge cards** — pathogen, symptoms, soil & UAV drivers with favourable ranges / weights / direction, critical growth stages, and recommendations

## Detection Engine (Soil + UAV Fusion)

```
For each disease, a curated knowledge base defines:
  (a) soil property ranges that favour the pathogen   (weighted)
  (b) UAV band / vegetation-index signatures           (weighted)

Trapezoidal membership  → per-feature risk 0-1
Weighted aggregation    → soil risk (0-100) + UAV risk (0-100)
Fusion                  → risk = soil × soilShare + uav × (1 − soilShare)
                          (soilShare is disease-specific, 0.40-0.55)
Classification          → low ≤29 · moderate 30-49 · high 50-69 · severe ≥70
Alerting                → high/severe findings raise actionable alerts
```

Derived indices computed from raw bands: NDVI, NDRE, GNDVI, SAVI, EVI, SIPI, PRI (band surrogate). Missing features are skipped with weight renormalisation; missing soil falls back to a UAV-only estimate at reduced confidence.

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Framework  | Next.js 16 (App Router) + React 19 |
| Language   | TypeScript                     |
| Database   | SQLite + Prisma ORM            |
| UI         | Tailwind CSS 4 + shadcn/ui     |
| Charts     | Recharts                       |

## Getting Started

### Prerequisites

- Node.js 18+ or [Bun](https://bun.sh)
- A drone survey dataset (or use the bundled demo seed)

### Install & Run

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Configure environment
cp .env.example .env

# 3. Create the database schema
bun run db:push    # or: npm run db:push

# 4. (Optional) Load 7 demo zones with 34 UAV surveys, 10 soil samples
#    and a full run of the disease engine (alerts included)
bun scripts/seed.ts

# 5. Start the dev server
bun run dev        # or: npm run dev
```

Open http://localhost:3000 — the integrated platform renders on the home page.

### Production Build

```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── zones/              # Zone CRUD (GET/POST, GET/PUT/DELETE by id)
│   │   ├── zones/[id]/detect/  # POST — run fused disease detection for a zone
│   │   ├── zones/[id]/soil/    # POST — record a soil sample
│   │   ├── readings/           # UAV survey reading CRUD (+ auto index derivation)
│   │   ├── disease/            # GET — disease monitoring dashboard payload
│   │   └── alerts/             # ack / ack-all endpoints
│   ├── page.tsx                # 4-tab platform shell
│   └── layout.tsx
├── components/
│   ├── platform-shell.tsx      # Header + tab navigation
│   ├── yield-forecast/         # Tab 1: dashboard, charts, dialogs, hooks
│   └── disease/                # Tabs 2-4: monitoring, dialogs, lab, knowledge base
└── lib/
    ├── forecast-engine.ts      # MVHS / NDVI regression / ensemble yield models
    ├── disease-engine.ts       # Knowledge base + trapezoidal fusion engine
    └── db.ts                   # Prisma client singleton
prisma/schema.prisma            # Zone, ZoneReading, SoilSample, DiseaseDetection, DiseaseAlert
scripts/seed.ts                 # Demo data + detection run
```

## API Overview

| Method             | Endpoint                  | Description                            |
| ------------------ | ------------------------- | -------------------------------------- |
| `GET/POST`         | `/api/zones`              | List / create zones                    |
| `GET/DELETE`       | `/api/zones/[id]`         | Zone detail (`?disease=1` full detail) |
| `POST`             | `/api/zones/[id]/detect`  | Run fused disease detection            |
| `POST`             | `/api/zones/[id]/soil`    | Record a soil sample                   |
| `GET/POST`         | `/api/readings`           | List / create UAV survey readings      |
| `GET/PUT/DELETE`   | `/api/readings/[id]`      | Manage a single reading                |
| `GET`              | `/api/disease`            | Disease monitoring dashboard payload   |
| `PATCH`            | `/api/alerts/[id]/ack`    | Acknowledge an alert                   |
| `POST`             | `/api/alerts/ack-all`     | Acknowledge all alerts                 |
| `GET`              | `/api`                    | Health check                           |

## Notes

- The SQLite database file lives at `db/custom.db` (gitignored) — created automatically by `db:push`.
- Index value ranges used by the entry dialogs: NDVI/GNDVI/NDRE ∈ [0, 1], LAI ∈ [0, 8], canopy cover ∈ [0, 100]%, reflectance bands ∈ [0, 1].
- Growth stages support both generic phases (early/mid/late) and cereal stages (tillering, jointing, booting, heading, flowering, grain fill, ripening) — mapped automatically onto the yield-model phases.
- Demo seed data spans maize, wheat, soybean, rice and cotton zones across the growing season, including two wheat zones with full soil histories and active disease alerts.
