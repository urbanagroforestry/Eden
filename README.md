# Food Forest Forge

Food Forest Forge is a U.S.-focused, geospatial concept-planning web app for edible food forest designs. Users search an address (or drop a pin), draw a property boundary, set preferences, refine shade assumptions, and generate an editable layered concept plan organized around the **7-layer food forest model**.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet + React Leaflet
- Turf.js
- Prisma + SQLite
- Zod validation
- pdf-lib for PDF export
- Vitest for engine tests

## What it does (MVP)
- Homepage + about page + plant library
- `/design/new` flow with geocoding, map marker, polygon boundary drawing, preferences, and JSON import
- Site profile inference with confidence labels (`inferred`, `user-corrected`, `verify`)
- Deterministic recommendation engine with 7-layer grouped output (`recommended`, `alternatives`, per-layer rationale)
- Editable shade tags (user correction overrides inferred assumptions)
- Concept layout generation with persisted items (generate / nudge / delete)
- Saved projects with SQLite persistence
- JSON export/import + PDF concept plan export + printable checklist
- Dev inspector page (`/dev`) for JSON inspection

## 7-layer model in the app
Core layers:
1. Canopy
2. Low-tree/Understory
3. Shrub
4. Herbaceous
5. Groundcover
6. Rhizosphere
7. Vertical

Support species are tracked separately for pollinator/insectary/nitrogen-fixer/chop-drop roles and shown as optional ecological enhancers.

## Setup
```bash
cp .env.example .env
npm run preflight
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Test
```bash
npm test
```

## Seeded demo content
- 100+ plants across all 7 layers + support species (with a minimum representation guard in seed script)
- 3 saved demo projects in different U.S. climates

## Export/import behavior
- JSON export: `GET /api/export/json?projectId=...`
- PDF export: `GET /api/export/pdf?projectId=...`
- JSON import accepts full export payload and reconstructs required project/profile/preferences defaults when needed.

## Troubleshooting

### 1) npm 403 registry errors during install
Symptoms:
- `npm install` returns `403 Forbidden - GET https://registry.npmjs.org/...`

Checks:
```bash
npm config get registry
npm config get proxy
npm config get https-proxy
npm run preflight
```

Fixes:
```bash
npm config set registry https://registry.npmjs.org/
npm config delete proxy
npm config delete https-proxy
npm cache clean --force
```

If your org uses an internal mirror, confirm your token/access policy with your admin.

### 2) `next`, `prisma`, or `vitest` not found
Symptoms:
- `sh: 1: next: not found`
- `sh: 1: prisma: not found`
- `sh: 1: vitest: not found`

Cause: dependencies were not installed successfully.

Fix:
```bash
rm -rf node_modules package-lock.json
npm install
npm run preflight
```

### 3) Prisma migrate/seed issues
Common causes:
- Missing `.env` or `DATABASE_URL`
- Schema/client not generated yet
- SQLite file permissions/path mismatch

Checks/fixes:
```bash
cp .env.example .env
npm run preflight
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

If migrations were interrupted, you can reset local DB (destructive):
```bash
npx prisma migrate reset
```


### 4) Map tiles blocked (OSM referer policy)
If map tiles show OSM access-blocked imagery in restrictive preview environments:
```bash
# Optional fallback tile source for previews
NEXT_PUBLIC_TILE_PROVIDER="carto-light"
```
Then restart dev server. Default remains OpenStreetMap (`osm`) and attribution is preserved in the map UI.

## Scientific honesty and disclaimers
Food Forest Forge is concept-planning software only; not legal, utility-locate, engineering, or stamped landscape architecture advice. Always verify on site.

## Known limitations
- Geocoder uses external Nominatim (availability dependent)
- Shade editing in MVP is point-tag based, not full raster paint
- Layout overlays are conceptual, not CAD-grade construction drawings
- Uploaded asset UI metadata model exists, but full upload pipeline is intentionally lightweight in v1

## Next-step ideas
1. Add full polygon shade painter + structure footprints.
2. Integrate real USDA/NOAA/EPA/USGS adapters.
3. Add species localization by ecoregion native-ness scoring.
4. Add nursery inventory + procurement workflows.
5. Add collaborative review and revision history.
