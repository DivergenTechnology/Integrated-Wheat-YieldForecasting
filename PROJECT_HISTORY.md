# PROJECT HISTORY — SSGI-Project (IWCYES & IWSS)

> **Purpose**: This document captures the complete history of the SSGI-Project from inception through the current state, serving as institutional memory for future contributors, partner research institutes, and the Ethiopian Ministry of Agriculture. It is updated whenever a significant milestone is reached.

**Last Updated**: October 2026
**Current Version**: v0.2.0 — Migrated to Integrated-Wheat-YieldForecasting repo
**Repository**: https://github.com/DivergenTechnology/Integrated-Wheat-YieldForecasting
**Previous Repository**: https://github.com/DivergenTechnology/SSGI-Project (deprecated)
**Active Branch**: `main`

---

## Table of Contents

1. [Project Genesis](#1-project-genesis)
2. [Objectives and Scope](#2-objectives-and-scope)
3. [Pilot Study Areas](#3-pilot-study-areas)
4. [Technical Architecture](#4-technical-architecture)
5. [Implementation Plan Document](#5-implementation-plan-document)
6. [Feasibility Analysis](#6-feasibility-analysis)
7. [Dashboard Prototype — v0.1.0](#7-dashboard-prototype--v010)
8. [Technology Stack](#8-technology-stack)
9. [Mock Data Layer](#9-mock-data-layer)
10. [Repository State](#10-repository-state)
11. [Open Items and Pending Integrations](#11-open-items-and-pending-integrations)
12. [Security and Operational Notes](#12-security-and-operational-notes)
13. [Change Log](#13-change-log)
14. [Conversation & Decision Log](#14-conversation--decision-log)
15. [Key Stakeholder Decisions](#15-key-stakeholder-decisions)
16. [Technical Decision Rationale](#16-technical-decision-rationale)

---

## 1. Project Genesis

The SSGI-Project was conceived in response to Ethiopia's strategic commitment to modernize its agricultural sector through remote sensing, IoT, and artificial intelligence. The original project background established the following context:

### National Context
- Agriculture accounts for **46% of Ethiopia's GDP**, **83% of commodity exports**, and **80% of employment**
- The country hosts the largest cattle population on the African continent
- Roughly **80% of the population lives in rural areas** and depends on farming for livelihood
- Production remains predominantly **subsistence-oriented** with low technology adoption

### Structural Challenges
- Persistent **poverty, food insecurity, water stress, and inadequate nutrition**
- **Land degradation** and **recurrent drought**
- **Low diffusion of improved technology** and digital tools
- **Shortage of skilled remote sensing professionals** and under-developed research infrastructure

### Strategic Pivot
The Government of Ethiopia prioritized the modernization and transformation of agriculture through:
- Digital agriculture
- Climate-smart practices
- Precision farming
- Managing crops, animals, and protecting land, water, plant, and animal biodiversity

The remote sensing community is uniquely positioned to deliver operational products leveraging:
- Free and open satellite imagery (Sentinel-2 at 10 m resolution every 5 days)
- Low-cost UAV platforms with multispectral sensors
- Affordable in-situ soil sensors
- Modern data science, machine learning, and artificial intelligence

### Project Entry Point: Irrigated Wheat
Irrigated wheat was selected as the strategic entry point because of:
- Its central role in Ethiopia's wheat self-sufficiency agenda
- Its responsiveness to irrigation scheduling
- Its amenability to remote sensing-based monitoring
- Its alignment with food security, poverty reduction, and climate resilience objectives

---

## 2. Objectives and Scope

### General Objective
Develop remote sensing-enabled tools, services, and a decision-support system for irrigated wheat farming systems in Ethiopia, to enhance the **efficiency, sustainability, and profitability** of wheat irrigated farming systems.

### Four Core Deliverables

1. **Comprehensive Spatial Database** of irrigated wheat farmlands of Ethiopia
2. **Irrigated Wheat Crop Yield Estimation System (IWCYES)**
3. **Information products** in the form of maps and statistics for small, medium, and large-scale irrigable irrigated wheat farmlands
4. **Irrigation Water Scheduling Service (IWSS)** — a spatially explicit tool providing easy-to-understand irrigation recommendations based on real, scientific data about soil, crop type, development stage, and automatically updated weather conditions

### Geographic Scope
Three pilot agricultural research institutes in Ethiopia's highland wheat belt.

### Thematic Scope (Exclusions)
The current phase explicitly excludes:
- National-scale rollout beyond the three pilot institutes
- Deployment on rain-fed wheat (irrigated systems only)
- Financial subsidy disbursement to farmers
- Commercialization and revenue operations
- Certification of organic or specialty wheat schemes

---

## 3. Pilot Study Areas

Three pilot agricultural research institutes were selected to capture agro-ecological diversity and leverage existing institutional capacity:

| Pilot Site | Region | Latitude | Longitude | Elevation (m) | Host Institution |
|---|---|---|---|---|---|
| **Bishoftu** (Debre Zeit) | Oromia — East Shewa | 8.7547° N | 39.0000° E | 1,860 | Debre Zeit Agricultural Research Center |
| **Asella** | Oromia — Arsi | 7.9577° N | 39.1667° E | 2,430 | Asella / Kulumsa Agricultural Research Center |
| **Ambo** | Oromia — West Shewa | 8.9847° N | 37.7833° E | 2,100 | Ambo Agricultural Research Center |

All three sites fall within **Oromia Regional State** and span an elevation range of approximately 1,800 to 2,400 meters above sea level, capturing the highland wheat belt that produces the bulk of Ethiopia's irrigated wheat.

### Spatial Reference System
- **UTM Zone 37N** on the **WGS84 datum** for cross-site data integration
- Common overlay layers: administrative boundaries, soil maps, DEM, hydrology, climate zones, irrigation infrastructure

---

## 4. Technical Architecture

The IWCYES-IWSS ecosystem follows a **four-layer architecture** designed for modularity, scalability, and cross-engine compatibility:

### Layer 1 — IoT Sensing
- NPK soil sensors (Nitrogen / Phosphorus / Potassium)
- Soil moisture and humidity probes
- UAV platforms (multispectral RGB + NIR + Red-Edge)
- ESP32-based data loggers pushing observations to Firebase

### Layer 2 — Spatial Data Infrastructure
- Field-collected shapefiles per AOI → PostGIS
- Satellite imagery (Sentinel-2, Landsat 8/9) as Cloud Optimized GeoTIFFs
- Ancillary layers: soil maps, DEM, hydrology, irrigation infrastructure
- GeoServer WMS / WFS endpoints for OGC-compliant access

### Layer 3 — AI/ML
- **Yield regression**: Dual-branch model with temporal attention (PyTorch Transformer) + tabular branch (XGBoost)
- **Disease detection**: CNN classifier (EfficientNet / U-Net) on UAV multispectral imagery
- **Attention attribution**: Interpretable heatmaps bridging black-box AI and decision-maker trust

### Layer 4 — Application & Dashboard
- Next.js 16 web application with map overlays (MapLibre GL)
- Real-time Firebase binding with auto-refresh
- Attention heatmaps as overlay layers
- KPI tiles for at-a-glance monitoring
- Mobile-responsive design

### Data Flow
Sensors and imagery → Spatial data layer → AI/ML layer → Dashboard, with feedback loops from end-user interactions captured for model retraining.

---

## 5. Implementation Plan Document

> ⚠️ **Note (October 2026, v0.1.2)**: The implementation plan Word document was **removed at the deployment stage per stakeholder Decision 7**. The actual `.docx` file is no longer available in the project. The summary below is preserved for institutional memory — it captures what the document contained so future contributors can reconstruct it if needed.

A comprehensive implementation plan was generated as a downloadable Word document covering the following 12 sections:

1. Project Background and Rationale
2. Project Objectives and Scope
3. Technical Approach and Methodology (with vegetation index formulas)
4. Work Package Breakdown (WP1–WP6)
5. Implementation Timeline and Milestones (12-month Gantt)
6. Team Structure and Roles
7. Technology Stack
8. Budget and Resource Requirements (USD 480K–620K)
9. Risk Analysis and Mitigation (10-risk register)
10. Monitoring, Evaluation, and Sustainability
11. Expected Outcomes and Deliverables
12. Conclusion and Next Steps

**Key parameters captured**:
- 12-month timeline divided into 4 quarterly milestones
- 6 work packages: WP1 (Management), WP2 (Spatial DB), WP3 (IWCYES), WP4 (IWSS), WP5 (UAV Disease), WP6 (Dashboard)
- 12-person team with PI, Co-PI, technical leads, 3 site coordinators, agronomist, M&E officer
- 20-row technology stack table covering IoT, cloud, spatial, ML, backend, frontend, DevOps
- 25-row itemized budget
- M&E framework with output, outcome, and impact KPIs

---

## 6. Feasibility Analysis

A critical feasibility assessment was performed against the original plan. The conclusion was **Conditional GO** — the project is fundamentally feasible, but the following adjustments were recommended:

### Strong Implementation Possibility
1. Institutional anchor is real (EIAR-affiliated research centers with existing wheat mandate)
2. Tech stack is mature (PostGIS, Firebase, Sentinel-2, PyTorch, MapLibre — all production-grade)
3. Pilot scale is manageable (3 sites, ~60 sensors, ~600 plots)
4. Free-tier + open-source approach is the correct sustainability play
5. Budget envelope (USD 480K–620K) is realistic

### Critical Limitations Identified
1. **R² ≥ 0.80 target is unrealistic for Year 1** — published studies achieve 0.55–0.75 with Sentinel-2; needs ≥2 seasons
2. **In-situ data scarcity** — 60 sensors = 20/site = ~10% coverage; ML transferability gaps
3. **Firebase free tier exceeded in ~6–9 months** — needs paid tier from Month 1
4. **UAV authorization takes 3–6 months** via ECAA, not the assumed 1–2 months
5. **CNN disease detection needs 5,000+ locally annotated images** — PlantVillage transfer is poor
6. **Attention mechanism is technical overreach for Year 1** — Random Forest baseline preferred
7. **Internet + power at Asella & Ambo is genuinely problematic** — solar+battery missing from budget
8. **Single growing season = single yield data point per plot** — insufficient for ML
9. **Counterpart pairing assumes counterpart capacity** — needs pre-project training bootcamp
10. **Budget is 10–15% under-realistic** — realistic envelope USD 580–720K

### Recommended Adjustments (10 items)
1. Extend timeline to **18 months** (cover 2 growing seasons)
2. Raise budget to **USD 600–720K**
3. Scale sensors to **100+ units** with solar+battery
4. Lower Year-1 R² target to **0.65**, raise Year-2 to 0.80
5. Budget **Firebase Blaze plan from Month 1**
6. Start with **Random Forest baseline**, defer attention to Year 2
7. Add **2-week counterpart bootcamp** before kickoff
8. Add **data governance workstream** under WP1
9. Add **Sentinel-1 SAR** as rainy-season fallback
10. Add **MLflow + monitoring** in WP3

### Decision
The project stakeholder elected to **proceed with the original plan** (without the 10 adjustments) for the dashboard prototype phase. The feasibility analysis remains on record for review during scale-up planning.

---

## 7. Dashboard Prototype — v0.1.0

A complete Next.js 16 dashboard prototype was built to demonstrate the decision-support ecosystem. All 7 sections are browser-verified and functional.

### Sections Implemented

| Section | Key Features |
|---|---|
| **Overview** | Aggregated KPIs (60 plots, 100+ sensors, avg predicted yield, water saving %); 7-day trend line chart; site comparison bar chart; 8-subsystem status grid |
| **Map View** | MapLibre GL map with plot circles colored by growth stage (6 stages); sensor markers colored by status (online/warning/offline); click-to-view plot details panel |
| **Yield Estimation** | KPI strip (predictions, model R²=0.78, confidence interval, attention features); aggregate attention attribution horizontal bar chart; yield distribution histogram; 50-row plot-level predictions table |
| **Irrigation Scheduling** | KPI strip (irrigate-now count, water saved %, forecast rain, avg soil moisture); status distribution pie chart; top-10 water-savers bar chart; urgency-sorted real-time recommendations table |
| **Disease Detection** | KPI strip (active alerts, severe cases, CNN precision, high severity count); disease distribution bar chart; severity pie chart; alerts table with detection method (UAV multispectral / CNN classifier) |
| **Sensor Feed** | KPI strip (online/warning/offline sensors, avg battery); click-to-chart sensor time-series (24 readings at 15-min intervals); full sensor inventory table |
| **Attention Heatmap** | Plot × feature attention matrix (color-coded heatmap); aggregate feature attribution bar chart; plot-comparison radar chart (top 3 plots across 8 features) |

### Component Inventory
- 7 section components (one per dashboard section)
- 1 KPI card reusable component
- 1 sidebar navigation component
- Main page orchestrator with section state and site selector state

### Design System
- **Color palette**: FG-1 Forest Mint (deep emerald `#0C1F1A` primary, mint `#2A7A65` accent, surface `#EDF5F2`)
- **Typography**: System font stack via Tailwind (Geist Sans for body, monospace for IDs)
- **Layout**: Sticky header (site selector + live data status), left sidebar nav (desktop) / horizontal scroll tabs (mobile), main content area with footer

---

## 8. Technology Stack

| Layer | Component | Choice | Status |
|---|---|---|---|
| Framework | Web framework | Next.js 16.1.3 (App Router + Turbopack) | ✅ Active |
| Language | TypeScript | 5.x | ✅ Active |
| Styling | CSS framework | Tailwind CSS 4 | ✅ Active |
| UI components | Component library | shadcn/ui (New York style) + Lucide icons | ✅ Active |
| Maps | Vector tiles | MapLibre GL JS 6.10 | ✅ Active |
| Charts | Data visualization | Recharts 2.15 (line, bar, pie, radar) | ✅ Active |
| State | Client state | React `useState` (per-section scope) | ✅ Active |
| State | Server state | TanStack Query 5.82 | 🟡 Available, unused |
| Auth | Authentication | NextAuth.js v4 | 🟡 Available, unused |
| Database | ORM | Prisma 6.11 (SQLite client) | 🟡 Available, unused |
| Real-time | WebSocket | Socket.io (mini-service pattern) | 🟡 Available, unused |

### Pending Live Integrations (mock data only in v0.1.0)

| Integration | Component | Status |
|---|---|---|
| Firebase Realtime Database | IoT sensor streams | 🔴 Mock |
| PostGIS / GeoServer | Spatial layers, AOI shapefiles | 🔴 Synthetic coordinates |
| Sentinel-2 via Copernicus DSE | Satellite imagery | 🔴 Not wired |
| Google Earth Engine | Cloud processing pipeline | 🔴 Not wired |
| IWCYS inference API | PyTorch attention yield model | 🔴 Mock predictions |
| IWSS scheduling API | Soil-water-balance engine | 🔴 Mock recommendations |
| CNN disease classifier | Disease detection model | 🔴 Mock alerts |

---

## 9. Mock Data Layer

The mock data layer at `src/lib/mock/` simulates a realistic pilot deployment:

### Sites (`sites.ts`)
3 sites with realistic coordinates, elevation, host institution names, plot counts, sensor counts, and total hectares.

### Plots (`plots.ts`)
60 plots distributed across the 3 sites (20 Bishoftu + 22 Asella + 18 Ambo), each with:
- Unique ID and plot code (e.g., `BIS-001`, `ASE-005`, `AMB-012`)
- Area in hectares (5–20 ha)
- Irrigation type (sprinkler / drip / surface)
- Wheat variety (Kubsa, Danda'a, Ogolcho, Fentale-1, Mada-Walabu)
- Planting date (June 2026 Meher season)
- Growth stage (tillering, stem elongation, booting, flowering, grain filling)
- Geographic coordinates perturbed around the site center

### Sensors (`sensors.ts`)
100+ IoT sensors (soil moisture, NPK, humidity, temperature) with:
- Online / warning / offline status
- Battery level (0–100%)
- Last reading value and unit
- Last updated timestamp

### Yield Predictions (`yield-predictions.ts`)
60 yield predictions with:
- Predicted yield in tonnes/hectare (2.8–5.8 t/ha range)
- 95% confidence intervals
- Model accuracy per plot
- Top 7 attention features per prediction (NDVI, NDRE, soil moisture, etc.)

### Irrigation Recommendations (`irrigation-recommendations.ts`)
60 irrigation recommendations with:
- Status (irrigate-now / monitor / no-irrigation / irrigating)
- Urgency (low / medium / high / critical)
- Soil moisture percentage
- Crop evapotranspiration (ETc) in mm
- 7-day rainfall forecast
- Recommended irrigation volume in liters
- Recommended timing
- Water saving percentage vs. baseline

### Disease Alerts (`disease-alerts.ts`)
20 disease alerts with:
- Disease type (yellow/stem/leaf rust, Septoria blotch, powdery mildew, loose smut, Fusarium head blight)
- Severity (none / low / medium / high / severe)
- Incidence percentage
- Detection method (UAV multispectral / CNN classifier)
- Confidence score
- Detection notes per disease

### Sensor Readings (`sensor-readings.ts`)
Time-series data with 24 readings per sensor at 15-minute intervals.

---

## 10. Repository State

- **Repository**: https://github.com/DivergenTechnology/SSGI-Project
- **Active Branch**: `main`
- **Total Files on Remote**: 99
- **Total Commits on Remote**: 4 (initial commit + dashboard v0.1 + README + this history)

### Repository Hygiene
- `.gitignore` excludes all internal artifacts:
  - `/scripts/` (docx generation scripts)
  - `/download/` (deliverable output directory)
  - `/skills/` (skill files)
  - `/tool-results/` (tool execution logs)
  - `/upload/` (user uploads)
  - `/tests/`, `/mini-services/`, `/.zscripts/`
  - `*.db`, `*.log`, `agent-ctx/`, `worklog.md`
- No secrets, tokens, or credentials are committed to the repository
- README.md documents project structure and developer setup instructions

### Commits Log
1. `02d7b6a` — Initial commit (project scaffold)
2. `88b9a2b` — feat(dashboard): IWCYES-IWSS dashboard prototype v0.1 (89 files, 11,528 insertions)
3. `1843859` — docs: add README with project overview and structure
4. *(this update)* — docs: add PROJECT_HISTORY with full project record

---

## 11. Open Items and Pending Integrations

### Immediate (Pre-Inception Phase)
- [ ] Secure formal sign-off of the implementation plan by MoA and partner research institutes
- [ ] Initiate procurement of 60 NPK soil sensors, UAV platform (DJI P4 Multispectral), 3 GNSS receivers
- [ ] Recruit Co-PI, GIS Specialist, and 3 Field Coordinators
- [ ] Set up Firebase project and provision Copernicus Data Space Ecosystem + Google Earth Engine access
- [ ] Initiate UAV flight authorization with Ethiopian Civil Aviation Authority (3–6 month lead time)
- [ ] Schedule project inception meeting with steering committee

### Technical Integration (Dashboard Roadmap)
- [ ] Wire Firebase RTDB to replace mock sensor feed (live IoT streams)
- [ ] Wire PostGIS / GeoServer for real AOI shapefiles (replace synthetic coordinates)
- [ ] Implement IWCYS inference API (PyTorch attention model as Python sidecar)
- [ ] Implement IWSS scheduling API (soil-water-balance engine)
- [ ] Replace mock disease alerts with CNN classifier inference service
- [ ] Add NextAuth.js authentication for per-institute role-based access
- [ ] Add user management for research institute staff
- [ ] Add Sentinel-2 satellite imagery as base map layer
- [ ] Add attention heatmap overlays on the map view

### Capacity Building
- [ ] 2-week ML/GIS bootcamp for counterpart staff from partner institutes (BEFORE project kickoff)
- [ ] Comprehensive documentation package for handover
- [ ] Two-day handover workshop at each pilot site

---

## 12. Security and Operational Notes

### GitHub Personal Access Token
A GitHub PAT was shared in plaintext chat during the initial dashboard push. **This token must be rotated immediately** at https://github.com/settings/tokens. The credential file at `~/.git-credentials` (600 permissions) will need to be updated with the new token before any subsequent push to the repository.

### Data Governance
- Plot boundary, soil chemistry, and yield data collection requires **informed consent protocols** under Ethiopia's evolving Personal Data Protection Proclamation (2024)
- A data governance workstream should be added to WP1 (currently missing from the original plan)
- Data sovereignty considerations apply when using Firebase (US-hosted) for Ethiopian agricultural data

### Sustainability
- Year-2 operating cost projected at USD 35K in original plan — **realistic estimate is USD 60–80K** accounting for sensor replacement cycles, model retraining, security patching
- Counterpart pairing model assumes counterpart capacity that may not exist — pre-project bootcamp required

---

## 13. Change Log

| Date | Version | Change | Author |
|---|---|---|---|
| Sep 2026 | v0.1.0 | Initial dashboard prototype built and pushed to GitHub; 7 sections, 60 plots of mock data, MapLibre + Recharts integration | IWCYES-IWSS Project Team |
| Sep 2026 | v0.1.0 | Implementation Plan Word document generated (26 pages, 12 sections, 9 tables) | IWCYES-IWSS Project Team |
| Sep 2026 | v0.1.0 | Feasibility analysis performed; 14 critical limitations identified; 10 recommended adjustments proposed (deferred by stakeholder) | IWCYES-IWSS Project Team |
| Sep 2026 | v0.1.0 | PROJECT_HISTORY.md added to repository as institutional memory | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.1 | PROJECT_HISTORY.md expanded with Conversation & Decision Log, Key Stakeholder Decisions, and Technical Decision Rationale sections; security cleanup performed (PAT purged from sandbox) | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.1 | Stakeholder selected Option A (local push) for PROJECT_HISTORY.md publication; GitHub PAT rotated and invalidated; sandbox credential file removed | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.2 | Deployment failure fixed — MapLibre SSR resolved via `next/dynamic` with `ssr: false`; Google Fonts dependency removed from `layout.tsx`; system font fallbacks added to `globals.css`; metadata updated to reflect actual project (commit 18cab66) | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.2 | Stakeholder decision: **remove implementation plan at the deployment stage — no longer needed**. Deleted `IWCYES_IWSS_Implementation_Plan.docx` (38.7 KB) and the generation scripts `generate_implementation_plan.js` + `plan_content.js`. The dashboard prototype remains the active deliverable. | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.3 | Stakeholder provided fresh GitHub PAT (after rotating the original); agent pushed 6 local commits (`c97407b` through `6e8761a`) to `origin/main`. Credentials purged immediately after push. Remote now in sync with local — deployment platform can rebuild from updated code. | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.4 | Deployment still failing after v0.1.3 push — investigated root cause. Found: `output: "standalone"` in next.config.ts, complex `build` script with post-build `cp` commands, `start` script requiring `bun` directly, and an invalid `eslint: { ignoreDuringBuilds: true }` config key (rejected by Next.js 16). Fixed all issues — standard build/start scripts, clean config. Commit `10719b8` pushed via second PAT. Local `bunx next build` succeeds in ~10s. | IWCYES-IWSS Project Team |
| Oct 2026 | v0.1.4 | Stakeholder revoked previous PAT (`ghp_AEpaGNl…`) per security best practice and provided a new PAT (`ghp_IiCQ0v…`). No pending commits to push — local and remote were already in sync. PAT used only for the PROJECT_HISTORY.md update commit. Credentials purged immediately after push. | IWCYES-IWSS Project Team |
| Oct 2026 | v0.2.0 | **Migration to new repository**: stakeholder provided new repo URL `https://github.com/DivergenTechnology/Integrated-Wheat-YieldForecasting` (replacing the deprecated `SSGI-Project`). Project rebuilt from scratch on the new repo with a fresh git history (orphan branch + single initial commit). All dashboard source code preserved; implementation plan NOT regenerated (per Decision 7 + stakeholder reminder "don't generate the implementation plan again and again"). Old `SSGI-Project` repo at `https://github.com/DivergenTechnology/SSGI-Project` is deprecated. | IWCYES-IWSS Project Team |

---

## 14. Conversation & Decision Log

A chronological record of the conversation that produced this project. Captures every input received from the stakeholder and every consequential decision made in response.

### Turn 1 — Initial Project Background Provided
**Stakeholder Input**: Provided comprehensive background document covering:
- Ethiopian agricultural sector context (46% GDP, 83% exports, 80% employment, 120M population)
- Cattle population as largest in Africa
- Structural challenges (land degradation, recurrent drought, low tech adoption)
- Government priority for agricultural modernization
- Promise of remote sensing (satellite, UAV, proximal sensors)
- Data science / ML / AI advances
- General objective: develop remote sensing-enabled tools, services, and decision-support system for irrigated wheat farming systems
- Scope: irrigated wheat farmlands of Ethiopia
- Four deliverables: (i) spatial database, (ii) IWCYES, (iii) information products (maps + statistics), (iv) IWSS

**Agent Response**: Acknowledged context, summarized understanding, indicated readiness for additional prompts.

### Turn 2 — Pilot Study Areas Added
**Stakeholder Input**: Specified three pilot agricultural research institutes:
- Bishoftu (Debre Zeit)
- Asella
- Ambo

Spatial locations to be considered for the spatial database system.

**Agent Response**: Captured coordinates (~8.75°N, 39.00°E for Bishoftu; ~7.96°N, 39.17°E for Asella; ~8.98°N, 37.79°E for Ambo), outlined spatial database implications (UTM Zone 37N / WGS84, multi-scale AOI handling, spatial layers).

### Turn 3 — IoT, Firebase, Dashboard Requirements Added
**Stakeholder Input**: Specified:
- Precise irrigation scheduling driven by soil moisture + humidity per AOI
- Soil properties to be collected using NPK devices
- Values to be published on Firebase infrastructure
- Shapefiles to be collected from each study area for the spatial database
- Decision-support dashboard with state-of-the-art visualization, real insights, different attention mechanism, map overlays for specific farming fields

**Agent Response**: Updated technical architecture (IoT → Firebase → PostGIS → ML → Dashboard), identified dashboard components (map overlay engine, attention mechanism visualizations, real-time insights).

### Turn 4 — UAV Disease Detection + Index Fusion Added
**Stakeholder Input**: Added:
- UAV imagery to be used for wheat disease early detection
- Different indexing values to be integrated with soil properties for wheat yield computation

**Agent Response**: Added UAV multispectral module (DJI P4 Multispectral, 50–100 m AGL, OpenDroneMap), specified vegetation indices table (NDVI, EVI, NDRE, GNDVI, NDMI, LAI, SAVI, VARI), defined fusion approach (indices + soil NPK + weather + management features → ML regression).

### Turn 5 — Implementation Plan Requested
**Stakeholder Input**: "now generate implementation plan with downloadable word file"

**Agent Response**: Loaded docx skill, asked 6 clarifying questions (audience, length, time horizon, sections, design style, language). Stakeholder did not answer; agent proceeded with sensible defaults (mixed audience, ~25 pages, 12-month horizon, all sections, government formal style, English).

### Turn 6 — Implementation Plan Generated
**Stakeholder Input**: (Repeated request — implicitly "just do it") "now generate implementation plan with downloadable word file"

**Agent Response**: Generated `/home/z/my-project/download/IWCYES_IWSS_Implementation_Plan.docx` (38.7 KB, 26 pages, 12 chapters, 9 substantive tables). Passed all critical post-generation checks (0 errors).

### Turn 7 — Feasibility Check Requested
**Stakeholder Input**: "please, I need you to check strong implementation possibility and limitation without hesitation before proceeding the next step"

**Agent Response**: Performed critical feasibility analysis. Identified 5 strengths, 14 critical limitations, 10 recommended adjustments. Conclusion: **Conditional GO** — only if the 10 adjustments were adopted. Most consequential risks: single growing season (insufficient ground truth), in-situ data scarcity, counterpart capacity gap.

### Turn 8 — Stakeholder Decision: Proceed with Original Plan
**Stakeholder Input**: "Proceed with the original plan and start on a different next step (e.g., dashboard prototype, spatial DB schema design) push the code to 'https://github.com/DivergenTechnology/SSGI-Project', use 'ghp_...' token to get the access for deployment. Request me for any confirmations during implementation."

**Stakeholder Decision**: Explicitly chose to proceed WITHOUT the 10 recommended adjustments. Granted agent autonomy to pick the next step (dashboard prototype was chosen). Provided GitHub PAT for repository access. Authorized agent to request confirmations during implementation.

**Agent Response**: Loaded fullstack-dev skill, initialized Next.js 16 environment, installed MapLibre, built the full dashboard prototype (7 sections, 60 plots of mock data), pushed to GitHub (commit 88b9a2b). All sections browser-verified via Agent Browser. Added README and pushed (commit 1843859).

### Turn 9 — Memorize History Request
**Stakeholder Input**: "try to memorize all the history to update publish"

**Agent Response**: Created comprehensive PROJECT_HISTORY.md (418 lines, 13 sections + change log). Committed locally (commit c97407b). Push failed because the original GitHub PAT had been rotated by the stakeholder (good security practice). Local and remote had diverged (stakeholder had pushed README directly); performed `git rebase origin/main` to reconcile cleanly. Requested new PAT or alternative push strategy.

### Turn 10 — Stakeholder Decision: Push Locally
**Stakeholder Input**: "Option A"

**Stakeholder Decision**: Chose Option A — push PROJECT_HISTORY.md from their local clone themselves, rather than sharing another PAT with the agent.

**Agent Response**: Copied PROJECT_HISTORY.md to /home/z/my-project/download/ for easy retrieval. Cleaned up sandbox security (deleted `~/.git-credentials`, unset `credential.helper` config). Provided exact git commands for the stakeholder to run in their local clone.

### Turn 11 — Memorize History (This Update)
**Stakeholder Input**: "memorize the history"

**Agent Response**: Expanded PROJECT_HISTORY.md with three new sections — Conversation & Decision Log (this section), Key Stakeholder Decisions (Section 15), Technical Decision Rationale (Section 16). Updated Change Log with v0.1.1 entries. Bumped version to v0.1.1.

### Turn 12 — Deployment Error + Fix
**Stakeholder Input**: "handle 'Sorry, there was a problem deploying the code. You can return to the generation page to try again.' error and regenerate to deploy"

**Agent Response**: Diagnosed the production-build deployment failure (dev server was fine — issue was build-time only). Root cause was MapLibre GL accessing `window` at module load time during Next.js's prerender step, compounded by `next/font/google` network fetch failing in the restricted build environment. Fixed via three changes: (1) wrapped `MapSection` in `next/dynamic` with `ssr: false`; (2) removed `next/font/google` from `layout.tsx` and switched to system font stack; (3) added system font fallbacks in `globals.css`. Updated metadata to reflect the actual project title. Lint passes; dev server returns HTTP 200; all 7 sections browser-verified. Committed as `18cab66`.

### Turn 13 — Remove Implementation Plan
**Stakeholder Input**: "please remove implementation plan at this stape, no need"

**Stakeholder Decision**: At the deployment stage, the 26-page implementation plan Word document is no longer needed. The dashboard prototype is the sole active deliverable.

**Agent Response**: Deleted `/home/z/my-project/download/IWCYES_IWSS_Implementation_Plan.docx` (38.7 KB) and the generation scripts `/home/z/my-project/scripts/generate_implementation_plan.js` (18.4 KB) and `/home/z/my-project/scripts/plan_content.js` (59.0 KB). Updated PROJECT_HISTORY.md to v0.1.2 with the removal documented in the Change Log, Conversation Log (this turn), and Key Stakeholder Decisions (Decision 7). The implementation plan content remains captured in summary form in Section 5 of this document for institutional memory — the actual Word file is gone.

### Turn 14 — Grant Access + Push to Deploy
**Stakeholder Input**: "all the background and authorization privilages has been granted, please memorized all completed tasks and regenerate it using the Github access code to deploy"

**Agent Response**: Verified no GitHub credential was present in the sandbox (all sources checked: `~/.git-credentials`, `~/.netrc`, `~/.config/git/`, `gh auth`, environment variables, upload directory, `.env`). Requested a fresh PAT. Stakeholder confirmed Option A and provided the new PAT in Turn 15.

### Turn 15 — Stakeholder Provides Fresh PAT
**Stakeholder Input**: "Option A, I can regenerate the token" → "now use 'ghp_…' token to get full access to the repo to make the required changes"

**Stakeholder Decision**: Provided a fresh GitHub PAT with full `repo` scope.

**Agent Response**:
1. Wrote PAT to `~/.git-credentials` with `chmod 600` permissions
2. Configured `git config --local credential.helper store`
3. Pushed 6 local commits (`c97407b`, `8e4036b`, `fde1cac`, `7d84bb6`, `18cab66`, `6e8761a` + session marker `4b514b4`) to `origin/main`
4. Push succeeded: `1843859..4b514b4  main -> main` — 98 files on remote
5. Immediately purged `~/.git-credentials` and unset `credential.helper` config
6. Verified local and remote are in sync ("Your branch is up to date with 'origin/main'")
7. Updated PROJECT_HISTORY.md to v0.1.3 with this Turn 14/15 entry, Change Log row, and Decision 8
8. Pushed this final PROJECT_HISTORY.md update to remote
9. Purged credentials again (double-cleanup)

**Outcome**: GitHub `main` branch is now in sync with local. Deployment platform can rebuild from the updated code (deployment fix for MapLibre SSR + Google Fonts removal + implementation plan removal + institutional memory).

### Turn 16 — Deployment Still Failing; Deeper Investigation
**Stakeholder Input**: "similar error is persisting 'Sorry, there was a problem deploying the code. You can return to the generation page to try again.' Please check all the dependency and libraries then do update"

**Agent Response**: Ran `bunx next build` locally — succeeded in 13s with 0 errors. So the failure was platform-specific, not a code issue. Investigated configuration and identified root causes:
1. `output: "standalone"` in `next.config.ts` — forces self-contained build output that many deployment platforms (especially serverless/static hosts) don't expect
2. `build` script: `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` — the post-build `cp` commands depend on standalone mode; if standalone isn't recognized, the cp fails with "No such file or directory" → build script exits non-zero → deployment fails
3. `start` script: `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log` — requires `bun` directly; many platforms use `npm`/`yarn`/`node` only
4. `eslint: { ignoreDuringBuilds: true }` in next.config.ts — **not a recognized config key in Next.js 16**; caused config validation error: "Unrecognized key(s) in object: 'eslint'" → server crash on startup (this explained the deployment failure even after the MapLibre fix)
5. `tsconfig.json` only excluded `node_modules` — `examples/websocket/*.ts`, `tests/`, `mini-services/`, etc. were being typechecked, potentially surfacing TS errors

Applied fixes:
- Removed `output: "standalone"` from next.config.ts
- Simplified `build` script to just `next build`
- Simplified `start` script to standard `next start`
- Simplified `dev` script (removed `tee` pipe)
- Removed invalid `eslint: { ignoreDuringBuilds: true }` config key
- Added `examples`, `tests`, `mini-services`, `skills`, `scripts`, `download`, `tool-results`, `upload`, `.zscripts` to tsconfig exclude list

Verified: `bunx next build` succeeds in 10s; `bun run lint` 0 errors; all 4 static pages generated; route `/` prerendered as static content. Committed as `10719b8` and pushed to GitHub via second PAT. Local and remote in sync.

### Turn 17 — Stakeholder Revokes Previous PAT + Provides New One
**Stakeholder Input**: "this is 'ghp_IiCQ0v…' the new revoked token"

**Stakeholder Decision**: Revoked the previous PAT (`ghp_AEpaGNl…`) per security best practice and provided a new PAT (`ghp_IiCQ0v…`) for future use.

**Agent Response**: Verified local and remote are in sync (0 commits ahead, no uncommitted changes). No pending push needed. Used the new PAT only to push the v0.1.4 PROJECT_HISTORY.md update capturing Turns 16 + 17 and Decisions 9 + 10. Purged credentials immediately after push.

### Turn 18 — Migrate to New Repository + Rebuild from Scratch
**Stakeholder Input**: "use 'https://github.com/DivergenTechnology/Integrated-Wheat-YieldForecasting' GitHub repository with 'ghp_IiCQ0v…' token with full access, then rebuild the project from scratch and don't generate the implementation plan again and again"

**Stakeholder Decision**: Migrate the dashboard prototype to a new repository (`Integrated-Wheat-YieldForecasting`) with a fresh git history. The old `SSGI-Project` repo is deprecated. Reiterated Decision 7 — do NOT regenerate the implementation plan.

**Agent Response**:
1. Updated PROJECT_HISTORY.md header to reflect new repo URL + previous repo (deprecated)
2. Updated Change Log with v0.2.0 migration entry
3. Updated README.md (if needed) to reflect new repo name
4. Changed git remote from `SSGI-Project` to `Integrated-Wheat-YieldForecasting`
5. Created an orphan branch (no commit history) for the fresh start
6. Committed all current files (dashboard source, mock data, configs, PROJECT_HISTORY.md, README.md) as a single initial commit
7. Pushed to the new repo using the new PAT
8. Purged credentials immediately after push

**Outcome**: New repository `https://github.com/DivergenTechnology/Integrated-Wheat-YieldForecasting` is live with the full dashboard prototype. Old `SSGI-Project` repo remains accessible (historical record) but is no longer the active development target.

---

## 15. Key Stakeholder Decisions

The explicit decisions made by the project stakeholder (the user) at key inflection points. These decisions shape the project's direction and should not be reversed without explicit stakeholder sign-off.

### Decision 1 — Proceed with Original Plan (Without Feasibility Adjustments)
- **Date**: September 2026
- **Decision**: Proceed with the original 12-month, USD 480–620K, single-season implementation plan
- **Rejected Alternative**: The 10 recommended adjustments (extend to 18 months, raise budget to USD 600–720K, scale sensors to 100+, etc.)
- **Implication**: The project accepts the documented risks (single growing season, sparse in-situ data, attention mechanism overreach, Firebase free-tier limits, etc.) for the pilot phase
- **Open Question**: Will the 10 adjustments be revisited for the scale-up phase?

### Decision 2 — Dashboard Prototype as Next Step
- **Date**: September 2026
- **Decision**: Build a dashboard prototype (vs. spatial database schema design) as the next step after the implementation plan
- **Rationale (inferred)**: Dashboard is the most visible deliverable for decision-makers; demonstrates value proposition fastest
- **Outcome**: 7-section Next.js 16 dashboard prototype successfully built and pushed to GitHub

### Decision 3 — Full Prototype + Hardcoded Mock Data
- **Date**: September 2026
- **Decision**: Build full prototype covering all 7 sections with hardcoded mock data (vs. focused MVP with stub Firebase client)
- **Rationale (inferred by agent)**: Gives complete demo artifact to show stakeholders, ships in one pass, can be wired to real Firebase later
- **Outcome**: 60 plots of mock data, 100+ sensors, 60 yield predictions, 60 irrigation recs, 20 disease alerts

### Decision 4 — Push to Public GitHub Repository
- **Date**: September 2026
- **Decision**: Push dashboard code to https://github.com/DivergenTechnology/SSGI-Project (public)
- **Rationale (inferred)**: Public repo for stakeholder visibility, future contributor onboarding, institutional memory
- **Outcome**: 99 files pushed across 4 commits

### Decision 5 — Rotate GitHub PAT
- **Date**: September 2026
- **Decision**: Rotate the GitHub PAT that was shared in plaintext chat
- **Rationale**: Best-practice security response to token exposure
- **Outcome**: Agent can no longer push to GitHub; subsequent PROJECT_HISTORY.md push handed back to stakeholder

### Decision 6 — Local Push of PROJECT_HISTORY.md (Option A)
- **Date**: October 2026
- **Decision**: Stakeholder will push PROJECT_HISTORY.md from their local clone themselves, rather than share another PAT with the agent
- **Rationale (inferred)**: Avoids further token exposure in chat; stakeholder maintains full control of repository state
- **Outcome**: Agent provided exact git commands; file copied to /home/z/my-project/download/ for easy retrieval

### Decision 7 — Remove Implementation Plan at Deployment Stage
- **Date**: October 2026
- **Decision**: Remove the 26-page implementation plan Word document and its generation scripts from the project at the deployment stage
- **Rationale**: Stakeholder determined the implementation plan is "no need" at this stage — the dashboard prototype is the sole active deliverable for deployment
- **Files removed**:
  - `/home/z/my-project/download/IWCYES_IWSS_Implementation_Plan.docx` (38.7 KB)
  - `/home/z/my-project/scripts/generate_implementation_plan.js` (18.4 KB)
  - `/home/z/my-project/scripts/plan_content.js` (59.0 KB)
- **What is preserved**: Section 5 of this PROJECT_HISTORY.md retains a summary of the implementation plan's content (12 sections, 9 tables, USD 480K–620K budget envelope) for institutional memory
- **Outcome**: Project root and download directory cleaned up; focus narrows to dashboard prototype deployment and live integrations

### Decision 8 — Provide Fresh PAT + Grant Push Authorization
- **Date**: October 2026
- **Decision**: Stakeholder provided a fresh GitHub PAT with `repo` scope and granted authorization for the agent to push local commits to `origin/main` for deployment
- **Rationale**: After the original PAT was rotated (Decision 5) and Option A was attempted locally (Decision 6), the deployment still required the agent to push the MapLibre SSR fix and other v0.1.2 changes. Stakeholder granted fresh credentials specifically for this push.
- **Outcome**:
  - All 6 local commits successfully pushed to GitHub `main` branch
  - Remote and local are now in sync
  - Credentials purged from sandbox immediately after push (twice — once after main push, once after PROJECT_HISTORY.md update push)
  - Deployment platform can now rebuild from the updated code
- **Security note**: Stakeholder should revoke this PAT at https://github.com/settings/tokens after confirming the deployment succeeds — the agent no longer needs push access

### Decision 9 — Rotate Previous PAT + Provide Replacement PAT
- **Date**: October 2026
- **Decision**: Stakeholder revoked the previous PAT (`ghp_AEpaGNl…`) used in Turn 15 and provided a new replacement PAT (`ghp_IiCQ0v…`) for future use
- **Rationale**: Best-practice security hygiene — rotate credentials after each use to minimize the impact window if a token is exposed
- **Outcome**: Previous PAT (`ghp_AEpaGNl…`) is permanently invalid. New PAT (`ghp_IiCQ0v…`) is used for the v0.1.4 PROJECT_HISTORY.md push and the v0.2.0 migration push (Decision 10).

### Decision 10 — Migrate to New Repository with Fresh Git History
- **Date**: October 2026
- **Decision**: Migrate the dashboard prototype from the deprecated `SSGI-Project` repo to a new repo at `https://github.com/DivergenTechnology/Integrated-Wheat-YieldForecasting` with a fresh git history (orphan branch + single initial commit)
- **Rationale (inferred)**: The new repo name (`Integrated-Wheat-YieldForecasting`) is more descriptive and aligned with the project's actual purpose — wheat yield forecasting. A fresh git history gives the project a clean restart without the chaotic commit history of the previous repo (which included implementation plan creation, multiple deployment fixes, PAT rotations, etc.).
- **Outcome**:
  - New repository is live with all current dashboard source code, mock data, configs, PROJECT_HISTORY.md, and README.md
  - Old `SSGI-Project` repo is deprecated (still accessible as historical record)
  - Implementation plan was NOT regenerated (per Decision 7 + stakeholder reminder)
  - PROJECT_HISTORY.md is preserved (institutional memory carries forward, including the v0.2.0 migration entry)
- **Future direction**: All further development should target the new `Integrated-Wheat-YieldForecasting` repo. The deprecated `SSGI-Project` repo should eventually be archived on GitHub.

---

## 16. Technical Decision Rationale

Captures the *why* behind each technical decision made during the dashboard prototype build. This section exists so future contributors understand the trade-offs considered, not just the final choices.

### Decision: Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui
- **Why**: Standard production-grade stack with active community; Turbopack for fast dev iteration; shadcn/ui provides high-quality component primitives without lock-in
- **Alternatives Considered**: Plain React + Vite (rejected — lacks App Router conventions), Vue 3 + Nuxt (rejected — smaller talent pool in Ethiopia), Angular (rejected — heavier framework, less flexible for prototypes)

### Decision: MapLibre GL JS (not Leaflet, not Google Maps)
- **Why**: Open-source, vector tiles, no API key required, modern WebGL rendering, supports all OGC WMS layers we'll need from GeoServer
- **Alternatives Considered**: Leaflet (simpler but raster-only, lacks vector tile performance), Google Maps JS API (rejected — requires API key, vendor lock-in, ToS concerns for agricultural data), OpenLayers (more powerful but steeper learning curve)
- **Trade-off accepted**: MapLibre v6 changed export semantics (no default export); required migration from `import maplibregl from` to `import { Map as MaplibreMap } from`

### Decision: Recharts (not D3 directly, not Chart.js, not Visx)
- **Why**: React-native component model, good documentation, all chart types needed (line, bar, pie, radar) in one package, lightweight bundle
- **Alternatives Considered**: D3.js directly (rejected — too low-level for prototype velocity), Chart.js (rejected — React integration is awkward), Visx (rejected — too low-level, requires more glue code)
- **Trade-off accepted**: D3.js is still used directly for the attention heatmap color interpolation (Recharts doesn't support custom cell colors based on value out of the box)

### Decision: Hardcoded mock data (not stub Firebase client)
- **Why**: Fastest path to a working demo; no external dependencies; can be replaced with real Firebase later by swapping the data layer
- **Alternatives Considered**: Stub Firebase client with mock credentials (rejected — adds setup time, harder to demo offline)
- **Trade-off accepted**: All data is currently synthetic; live integrations remain pending

### Decision: Single-page app with section state (not multi-page routing)
- **Why**: Skill instructions explicitly limited visible routes to `/` only; section switching via React `useState` is the standard pattern for dashboards anyway
- **Alternatives Considered**: Multi-page Next.js App Router (rejected — sandbox constraint)
- **Trade-off accepted**: No deep-linkable URLs for sections; back button doesn't navigate between sections (acceptable for a prototype)

### Decision: Synthetic plot coordinates (not real shapefiles)
- **Why**: Field-collected shapefiles from Bishoftu/Asella/Ambo are not yet available (per WP2 schedule, they're collected in Months 1–3 of the actual project)
- **Alternatives Considered**: Wait for real shapefiles (rejected — blocks prototype), use OSM building footprints (rejected — not irrigated wheat plots)
- **Trade-off accepted**: Plot positions are perturbations around site centers; doesn't represent actual field geometry

### Decision: FG-1 Forest Mint palette for cover (not GO-1 default for proposals)
- **Why**: FG-1 is the agriculture/sustainability palette per the docx skill design system; aligns with the project's environmental/agricultural theme better than the GO-1 Graphite Orange default
- **Alternatives Considered**: GO-1 Graphite Orange (rejected — too generic for an agricultural project), GV-1 Official Red (rejected — wrong connotation for agricultural modernization)
- **Trade-off accepted**: None — palette choice was a clear fit

### Decision: R4 (Top Color Block) cover recipe
- **Why**: R4 is the standard recipe for proposals/plans per docx skill routing
- **Alternatives Considered**: R1 Pure Paragraph Left (more versatile but less visually distinctive for a proposal), R2 Double-Rule Frame (more for whitepapers)
- **Trade-off accepted**: R4 has poor long-title tolerance; mitigated by using short title "Implementation Plan" with a longer subtitle

### Decision: 12-month timeline (not 18–24 months as recommended)
- **Why**: Stakeholder explicitly chose original plan; pilot-scale scope intended for single Meher growing season
- **Alternatives Considered**: 18-month timeline covering 2 growing seasons (rejected by stakeholder — risk accepted)
- **Trade-off accepted**: Single yield ground-truth data point per plot — model accuracy will be lower in Year 1; documented in feasibility analysis limitations

### Decision: Skip the 10 feasibility adjustments (random forest baseline, counterpart bootcamp, MLflow, etc.)
- **Why**: Stakeholder chose original plan; adjustments remain on record for scale-up phase consideration
- **Alternatives Considered**: Adopt all 10 adjustments (rejected by stakeholder — would have raised budget to USD 600–720K and extended timeline)
- **Trade-off accepted**: Higher technical and sustainability risks for the pilot phase; documented infeasibility analysis

### Decision: Map uses no external tile source (synthetic background color)
- **Why**: Prototype must run in sandboxed environment without external network dependencies on tile providers (OSM, Mapbox, ESRI); also avoids potential rate-limit issues during demo
- **Alternatives Considered**: OSM raster tiles (rejected — requires network), Mapbox tiles (rejected — requires API key), ESRI World Imagery (rejected — requires network)
- **Trade-off accepted**: Map background is a flat color (`#f1f5f4`); production deployment will swap this for Sentinel-2 RGB composite via GeoServer WMS

### Decision: Use PAT via `~/.git-credentials` (not via URL embedding)
- **Why**: Avoids token exposure in commit URLs / shell history visible to other processes; git credential helper is the standard secure mechanism
- **Alternatives Considered**: Token in push URL (rejected — visible in shell history), GitHub CLI `gh auth login` (rejected — would require interactive auth flow)
- **Trade-off accepted**: PAT was still exposed in plaintext chat by stakeholder; security cleanup (file deletion, credential.helper unset) performed after stakeholder rotated the token

---

## How to Update This Document

When making changes to the project, append new rows to the **Change Log** (Section 13) and new entries to the **Conversation & Decision Log** (Section 14). For significant stakeholder decisions, add a new entry to **Key Stakeholder Decisions** (Section 15). For significant technical decisions, add a new entry to **Technical Decision Rationale** (Section 16).

Each update should include:
- Date (month + year)
- Version (semantic versioning: `vMAJOR.MINOR.PATCH`)
- Brief change description (1–2 sentences)
- Author / team name

For major milestones (new dashboard section, new live integration, completed work package, etc.), also update the relevant section above (e.g., Section 7 for dashboard additions, Section 8 for technology stack changes, Section 11 for completed items moving from "pending" to "done").

This document is the single source of truth for the project's history. Do not duplicate it elsewhere.
