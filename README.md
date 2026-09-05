# Integrated Wheat Yield Forecasting

UAV (drone) remote-sensing based crop yield forecasting system. Survey zones with multi-spectral vegetation indices (NDVI, GNDVI, NDRE, LAI, canopy cover) and generate per-zone yield forecasts from three interchangeable models — in a single dashboard.

## Features

- **Zone management** — define agricultural zones (crop type, area, soil type, description)
- **UAV survey entry** — record per-date readings: NDVI, GNDVI, NDRE, LAI, canopy cover (%), growth stage, drone/sensor metadata
- **Forecast models** (switchable, live recalculation):
  - **MVHS** — Multi-Index Vegetation Health Score with weighted indices + crop-specific yield response curves
  - **NDVI Regression** — linear NDVI→yield regression with crop-specific slopes
  - **Ensemble** — 55/45 blend of the two above (default), with agreement/confidence estimation
- **Stress detection & health grading** — flags index anomalies (nutrient stress, water stress, canopy gaps)
- **Visual analytics** — forecast bar chart with confidence intervals, seasonal NDVI trend lines, per-zone detail dialogs
- **Responsive UI** — desktop and mobile

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

# 4. (Optional) Load 6 demo zones with 30 survey readings
bun scripts/seed.ts

# 5. Start the dev server
bun run dev        # or: npm run dev
```

Open http://localhost:3000 — the yield forecasting dashboard renders on the home page.

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
│   │   ├── zones/          # Zone CRUD (GET/POST, GET/PUT/DELETE by id)
│   │   └── readings/       # UAV survey reading CRUD
│   ├── page.tsx            # Dashboard entry
│   └── layout.tsx
├── components/
│   ├── yield-forecast/
│   │   ├── dashboard.tsx   # Main dashboard: stat cards, zone grid, model switcher
│   │   ├── charts.tsx      # Forecast bars (CI bands), NDVI seasonal trend
│   │   ├── dialogs.tsx     # Zone detail / survey entry / new zone dialogs
│   │   ├── hooks.ts        # Data fetching + forecast computation hooks
│   │   └── types.ts        # Shared domain types
│   └── ui/                 # shadcn/ui primitives
└── lib/
    ├── forecast-engine.ts  # MVHS, NDVI regression, ensemble models + stress detection
    └── db.ts               # Prisma client singleton
prisma/schema.prisma        # Zone & ZoneReading models
scripts/seed.ts             # Demo data: 6 zones, 30 UAV surveys
```

## Forecast Models

Each model consumes the latest survey window per zone and outputs expected yield (t/ha) with a confidence interval:

1. **MVHS** — normalizes each index, applies crop-specific weights to build a 0–100 vegetation health score, then maps the score through a sigmoid-shaped yield response curve calibrated per crop.
2. **NDVI Regression** — classic linear model `Y = a + b × NDVI` with per-crop slope/intercept derived from field trial literature values.
3. **Ensemble** — weighted average (55% MVHS / 45% regression). When the two models disagree beyond a threshold, confidence is reduced and the forecast is flagged.

## API Overview

| Method             | Endpoint           | Description                  |
| ------------------ | ------------------ | ---------------------------- |
| `GET/POST`         | `/api/zones`       | List / create zones          |
| `GET/PUT/DELETE`   | `/api/zones/[id]`  | Read / update / delete zone  |
| `GET/POST`         | `/api/readings`    | List / create survey readings|
| `GET/PUT/DELETE`   | `/api/readings/[id]` | Manage a single reading    |
| `GET`              | `/api`             | Health check                 |

## Notes

- The SQLite database file lives at `db/custom.db` (gitignored) — created automatically by `db:push`.
- Index value ranges used by the entry dialogs: NDVI/GNDVI/NDRE ∈ [0, 1], LAI ∈ [0, 8], canopy cover ∈ [0, 100]%.
- Demo seed data spans maize, wheat, soybean, rice and cotton zones across the growing season.
