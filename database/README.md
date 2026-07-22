# Database

The MVP uses SQLite-compatible SQL files for the initial schema and seed data. This keeps the project dependency-free while preserving a concrete relational design that can be moved behind the backend in later phases.

## Files

- `migrations/001_initial_schema.sql`: creates the normalized MVP tables, foreign keys, checks, and indexes.
- `seeds/001_mvp_seed.sql`: inserts exactly one admin, two homeowners, two homes, initial rooms, three device types, devices, seed events, notifications, and per-user notification preferences.

## Current Assumptions

- Home-level access is represented by `home_memberships`.
- The home is the tenant boundary, so tenant-scoped tables include `home_id` directly.
- Device type capabilities are stored as JSON on `device_types` to support future device types without changing core relationship tables.
- Schema files define constraints only; auth, API routes, frontend screens, and simulator behavior are not implemented in this phase.
