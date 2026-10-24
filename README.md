# Integrated-Wheat-YieldForecasting — IWCYES & IWSS Dashboard

**Remote Sensing-Enabled Decision Support System for Irrigated Wheat Farming in Ethiopia**

This repository hosts the dashboard prototype for the **Irrigated Wheat Crop Yield Estimation System (IWCYES)** and the **Irrigation Water Scheduling Service (IWSS)** — piloted across three Ethiopian agricultural research institutes:

| Pilot Site | Region | Host Institution |
|---|---|---|
| Bishoftu (Debre Zeit) | Oromia — East Shewa | Debre Zeit Agricultural Research Center |
| Asella | Oromia — Arsi | Asella / Kulumsa Agricultural Research Center |
| Ambo | Oromia — West Shewa | Ambo Agricultural Research Center |

---

## Dashboard Sections

| Section | Description |
|---|---|
| **Overview** | Aggregated KPIs across pilot sites, 7-day trend, site comparison, system status |
| **Map View** | MapLibre GL map with plot circles (colored by growth stage) + sensor markers (colored by status) |
| **Yield Estimation** | Plot-level predictions with confidence intervals and attention feature attribution chart |
| **Irrigation Scheduling** | Real-time recommendations (status, urgency, soil moisture, ETc, rainfall forecast, volume) |
| **Disease Detection** | UAV multispectral CNN alerts with severity breakdown (yellow rust, stem rust, Septoria, etc.) |
| **Sensor Feed** | IoT sensor inventory with click-to-chart time-series visualization |
| **Attention Heatmap** | Plot × feature matrix showing which inputs drive the dual-branch attention model's predictions |

---

## Tech Stack

- **Framework**: Next.js 16.1.3 with App Router + Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Maps**: MapLibre GL JS 6.10
- **Charts**: Recharts 2.15 (line, bar, pie, radar)
- **Icons**: Lucide React
- **State**: React `useState` (per-section scope; Zustand/TanStack Query available if backend wired)

---

## Mock Data Layer

All data is hardcoded TypeScript — no backend dependencies. The mock layer simulates:

- **60 plots** distributed across the 3 pilot sites (20 Bishoftu + 22 Asella + 18 Ambo)
- **100+ IoT sensors** (soil moisture, NPK, humidity, temperature)
- **60 yield predictions** with attention feature attributions (7 features per plot)
- **60 irrigation recommendations** with water-saving percentages and urgency tiers
- **20 disease alerts** with severity tiers and UAV/CNN detection metadata
- **Time-series readings**: 24 readings per sensor (15-minute intervals)

Live integrations are pending:
- Firebase Realtime Database for IoT sensor streams
- PostGIS / GeoServer for spatial layers
- Sentinel-2 via Copernicus Data Space Ecosystem
- IWCYS inference API (PyTorch attention-based yield model)
- IWSS scheduling API (soil-water-balance engine)
- CNN disease classifier service

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard page (single route)
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind + global styles
├── components/
│   ├── dashboard/
│   │   ├── kpi/
│   │   │   └── kpi-card.tsx  # Reusable KPI card
│   │   ├── sidebar-nav.tsx   # Section navigation sidebar
│   │   └── sections/
│   │       ├── overview-section.tsx
│   │       ├── map-section.tsx
│   │       ├── yield-section.tsx
│   │       ├── irrigation-section.tsx
│   │       ├── disease-section.tsx
│   │       ├── sensor-feed-section.tsx
│   │       └── attention-heatmap-section.tsx
│   └── ui/                   # shadcn/ui component library
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── mock/                 # Mock data layer
│   │   ├── sites.ts
│   │   ├── plots.ts
│   │   ├── sensors.ts
│   │   ├── yield-predictions.ts
│   │   ├── irrigation-recommendations.ts
│   │   ├── disease-alerts.ts
│   │   ├── sensor-readings.ts
│   │   └── index.ts          # Aggregator + getDashboardStats()
│   └── utils.ts              # cn() helper
└── ...
```

---

## Development

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Lint
bun run lint

# Production build
bun run build && bun run start
```

Open the dashboard at `http://localhost:3000`.

---

## Implementation Plan

The full implementation plan is available as a separate Word document covering:
- Project background, objectives, and scope
- Technical approach and methodology
- Work package breakdown (WP1–WP6)
- 12-month timeline with quarterly milestones
- Team structure and role allocation
- Technology stack by layer
- Itemized budget (USD 480k–620k)
- Risk register (top 10 risks)
- M&E indicator framework
- Expected outcomes and deliverables

---

## License

Proprietary — pilot project. All rights reserved by DivergenTechnology and partner research institutes.

---

## Acknowledgements

Project sponsors: TBD
Partner institutes: Debre Zeit ARC, Asella / Kulumsa ARC, Ambo ARC
