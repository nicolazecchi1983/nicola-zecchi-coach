# STAFF — Configurable Match Analysis Schema

## Product rule

STAFF provides structure without imposing one coach's methodology.

The Match domain has three stable macro-phases:

1. Fase di possesso
2. Fase di non possesso
3. Transizioni

Everything below those macro-phases is user-configurable. Suggested subphases may be offered as shortcuts, but they are not stored as mandatory fields and are never rendered by default.

## Shared engine

The same schema and editor are reused by:

- Studio avversario
- Avversario
- Analisi gara

This prevents three separate taxonomies from drifting apart.

## Data contract

The canonical payload is JSON with a version and `phases[]`. Each phase owns:

- `key`
- `title`
- optional general `note`
- optional `subsections[]`

Each subsection owns:

- stable `id`
- editable `title`
- optional `note`

Legacy fixed fields remain read-compatible for older saved matches, but new editing writes the configurable schema.

## Architecture constraints

- no new Match route;
- no second Match identity;
- no new Supabase table for this release;
- Studio avversario remains stored inside canonical Calendar event notes;
- Match draft and Match Report keep their existing persistence path;
- Report rendering consumes the shared schema;
- UI suggestions are not domain requirements.

## Beyond the bug

Any future technical-analysis feature must first ask whether it belongs in the shared schema rather than adding another hardcoded textarea to a single screen.
