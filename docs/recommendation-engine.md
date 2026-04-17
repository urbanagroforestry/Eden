# Recommendation Engine Notes

## Inputs
- Site profile proxies (hardiness, precipitation, sun distribution, slope confidence)
- User preferences and constraints
- Template objective weights
- 100+ plant database records tagged by 7 layers + support role

## Deterministic flow
1. Hardiness survivability filter.
2. Shade fit factor and water/maintenance fit.
3. Constraint penalties (messy fruit, root risk near foundation).
4. Weighted objective scoring (production, biodiversity, aesthetics, maintenance, water, neighborhood fit).
5. Group output by 7 layers and select recommended + alternatives.
6. Add support species list.
7. Return confidence + rationale + phased plan.

## Transparency
Warnings are generated when a layer has no high-fit candidates under current conditions.
