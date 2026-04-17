# Food Forest Forge Architecture

## Overview
Food Forest Forge is a monolithic Next.js App Router application with Prisma + SQLite persistence.

## Core systems
- **UI layer**: Next.js pages in `src/app/*`.
- **Geospatial editing**: `react-leaflet` map editor with marker dragging and click-to-build polygon boundary.
- **Site profiling**: `HeuristicEnvironmentalAdapter` computes MVP hardiness, precipitation, sun, slope/aspect placeholders.
- **Recommendation engine**: deterministic weighted ranking in `src/lib/recommendation-engine.ts` grouped by 7 food-forest layers.
- **Persistence**: Prisma models for projects, profile, preferences, layout, uploads, and plant library.
- **Export**: JSON API export and PDF generation via `pdf-lib`.

## Future adapter extension points
See `src/lib/adapters.ts` and roadmap docs for USDA/NOAA/EPA/USGS/mobile scan/nursery adapters.
