# STAFF 0.28.5 — Safe Write Retry Pilot

## Decision
Automatic write retries are allowed only for operations proven idempotent by identity and payload semantics.

## Enabled pilot
- `player_profiles` UPSERT on `player_id`
- legacy `player_profiles` UPSERT on `player_key`
- `team_players` UPDATE scoped by `team_id + playerId`
- `team_players` soft-deactivation (`active=false`) scoped by `team_id + playerId`

All use `DATA_OPERATION_KIND.IDEMPOTENT_WRITE` and the existing bounded backoff (250ms, 500ms).

## Explicitly excluded
No automatic retry for generic INSERT/CREATE, DELETE, BATCH, calendar import, match-analysis inserts, file/storage upload flows, or compound workflows.

## Safety rationale
The pilot operations converge to the same stored state if repeated. Retry preserves the existing Supabase response shape and only occurs for transient network/timeout/rate-limit/server-unavailable errors.

## Architecture review
Do not expand automatic write retries by convenience. Each future candidate requires an idempotency review, deterministic identity, stable payload across attempts, and a regression guard.
