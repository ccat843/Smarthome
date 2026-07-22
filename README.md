# Modular Smart Home MVP

This repository defines the source-of-truth documentation for a modular, multi-tenant smart home MVP. The MVP models exactly two homes managed by one admin and used by two homeowners. It supports three device types: lights, heaters, and door locks.

## MVP Goal

Build a small but complete smart home platform that demonstrates:

- Strict home-level access control so homeowners never see another home's data.
- A common capability-based interface for all devices.
- Modular device behavior that can be extended without rewriting core app flows.
- Notifications tied to homes, devices, and device events.
- A simulator-driven implementation path before real device integration.

## What the System Demonstrates

The MVP is intended to prove the architecture, data model, API contracts, and device behavior for a smart home platform. It is not intended to be a production IoT system yet. Future implementation tasks must treat the files in `docs/` as the canonical specification and avoid inventing features outside the MVP scope.

## Documentation Map

Read the documentation in this order before making implementation changes:

1. `docs/CODEX_RULES.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/MVP_SCOPE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/DEVICE_CAPABILITIES.md`
7. `docs/API_CONTRACTS.md`
8. `docs/NOTIFICATIONS.md`
9. `docs/ROADMAP.md`

## Repository Organization

This scaffold uses a minimal JavaScript workspace layout so frontend, backend, and shared code can evolve independently while following the MVP documentation.

- `apps/frontend/`: placeholder frontend app boundary. UI screens are intentionally not implemented yet.
- `apps/backend/`: placeholder backend app boundary. API logic is intentionally not implemented yet.
- `packages/shared/`: placeholder shared package for future cross-app types and common utilities.
- `test/`: minimal scaffold checks.
- `docs/`: source-of-truth MVP documentation that must be read before implementation work.

The initial stack is plain JavaScript with npm workspaces and Node's built-in test runner. Lightweight local lint and format checks avoid external dependencies until the MVP implementation phases require them.
