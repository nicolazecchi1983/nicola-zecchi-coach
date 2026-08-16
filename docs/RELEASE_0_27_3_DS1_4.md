# STAFF 0.27.3 — DS1.4 Surfaces, Cards & Section Hierarchy

## Scope

Visual consolidation only. No domain, persistence, route, Supabase or workflow changes.

## Design decisions

- Surfaces communicate real grouping; whitespace and dividers carry secondary hierarchy.
- Shared legacy containers converge on the STAFF neutral surface palette.
- Nested Dashboard summaries lose decorative fills.
- KPI cards remain distinct because they are genuine summary containers.
- Empty states stay lightweight instead of becoming oversized cards.
- Product UI keeps Training/Match domain grouping but uses the subtle canonical border.
- No new raw colors, `!important` rules or breakpoints are introduced.

## Benchmark rationale

Material Design distinguishes card/surface types and treats cards as purposeful containers rather than a universal wrapper. Apple layout guidance emphasizes grouping related content using hierarchy, alignment and spacing. STAFF applies those principles by reducing nested visual boxes while preserving containers that encode real product meaning.

## Regression scope

Dashboard, Training, Match, Calendar, Roster, Settings, Training Library, mobile surface padding and existing product navigation.
