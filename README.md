# Modular Smart Home MVP

This repository contains a small, demo-ready smart home MVP. It models exactly two homes managed by one admin and used by two homeowners. It supports three device types: lights, heaters, and door locks.

## MVP Goal

Build a small but complete smart home platform that demonstrates:

- Strict home-level access control so homeowners never see another home's data.
- A common capability-based interface for all devices.
- Modular device behavior that can be extended without rewriting core app flows.
- Device actions that create home- and device-scoped events.
- Notifications and preferences tied to homes, devices, events, and users.
- A simulator-driven implementation path before real device integration.

## What Is Included

- Plain JavaScript npm workspace using Node's built-in test runner.
- In-memory backend app with auth, homes, rooms, devices, device actions, events, notifications, and notification preferences.
- Frontend dashboard for the MVP login, admin, and homeowner flows.
- Demo frontend server that serves the static UI and routes API calls to the in-memory backend.
- SQLite schema and seed files that mirror the documented MVP data model.

## Local Demo

Requirements:

- Node.js 20 or newer.
- npm.
- `sqlite3` CLI for database schema tests.

Install dependencies:

```bash
npm install
```

Run the demo UI:

```bash
npm run dev
```

Open <http://localhost:5173>. The demo server keeps data in memory, so restarting it resets homes, devices, events, notifications, and preferences to the MVP seed state.

Demo users:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin@smarthome.local` | `admin-password` | Home 1 and Home 2 |
| Homeowner 1 | `homeowner1@smarthome.local` | `homeowner1-password` | Home 1 only |
| Homeowner 2 | `homeowner2@smarthome.local` | `homeowner2-password` | Home 2 only |

## Verification Commands

```bash
npm run build
npm run lint
npm run format
npm test
```

## Documentation Map

Before changing application behavior, read the documentation in this order:

1. `README.md`
2. `docs/CODEX_RULES.md`
3. `docs/PROJECT_BRIEF.md`
4. `docs/MVP_SCOPE.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DATA_MODEL.md`
7. `docs/DEVICE_CAPABILITIES.md`
8. `docs/API_CONTRACTS.md`
9. `docs/NOTIFICATIONS.md`
10. `docs/ROADMAP.md`

The files in `docs/` are the source of truth for MVP scope, roles, access control, data model, API contracts, device behavior, and notification behavior.

## Repository Organization

- `apps/frontend/`: frontend dashboard and local demo server.
- `apps/backend/`: in-memory backend app, auth guards, repositories, device abstraction, simulator, events, and notifications.
- `packages/shared/`: shared package boundary for cross-app types/utilities as the MVP grows.
- `database/`: SQLite schema and seed data for the documented data model.
- `test/`: Node test suites for auth, access control, API flows, device actions, notifications, frontend rendering helpers, and database constraints.
- `docs/`: source-of-truth MVP documentation.

## Remaining MVP Limitations

- The demo backend is in-memory; it resets on restart.
- The simulator replaces real IoT hardware/MQTT integrations.
- Notification delivery is record-only; there is no email, SMS, or push provider.
- The frontend is intentionally lightweight and framework-free for the MVP.
