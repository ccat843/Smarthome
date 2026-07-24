# Developer Guide

This handbook explains how to set up, run, understand, maintain, and extend the Smart Home MVP as it exists in this repository.

## 1. Project Overview

### What the project is

This project is a modular smart home MVP for managing devices across exactly two homes. It demonstrates a multi-tenant smart home platform where homeowners can only access their assigned home while one admin can access both MVP homes.

### MVP goal

The MVP proves that the system can:

- Authenticate one admin and two homeowners.
- Enforce strict home-level data isolation.
- Model homes, rooms, device types, devices, device events, notifications, and notification preferences.
- Control three supported device types through one capability-based device interface.
- Record device events from user/admin actions and simulator changes.
- Create home-, device-, event-, and user-scoped notifications.

### Core architecture

The implementation is a plain JavaScript npm workspace with these main boundaries:

| Boundary | Current implementation | Responsibility |
| --- | --- | --- |
| Frontend | `apps/frontend/src/main.js` plus `apps/frontend/dev-server.mjs` | Login, home tabs, rooms, device controls, events, notifications, and preferences. |
| Backend | `apps/backend/src/**` | Auth, authorization, in-memory repositories, device action handling, event creation, notification creation, and simulator helpers. |
| Database | `database/migrations/*.sql` and `database/seeds/*.sql` | SQLite-compatible schema and MVP seed data that mirror the documented data model. |
| Shared package | `packages/shared/src/index.js` | Workspace package boundary for future shared types/utilities. Currently a scaffold placeholder. |
| Tests | `test/*.test.mjs` | Node test suites for auth/access, data model, APIs, device actions, simulator behavior, notifications, frontend helpers, and end-to-end MVP flow. |

The running local demo uses an in-memory backend store. The SQLite files are used by tests and document the relational design, but the demo server does not currently persist runtime data to SQLite.

### Main technologies used

- Node.js 20 or newer.
- npm workspaces.
- Native ECMAScript modules (`"type": "module"`).
- Node's built-in `node --test` runner.
- SQLite-compatible SQL schema and seed files.
- Framework-free browser frontend served by a small Node HTTP server.
- No real IoT, MQTT, email, SMS, or push integrations in the MVP.

## 2. Repository Structure

```text
.
├── README.md
├── package.json
├── package-lock.json
├── apps/
│   ├── backend/
│   │   ├── package.json
│   │   └── src/
│   │       ├── auth/
│   │       ├── device-capabilities/
│   │       ├── device-events/
│   │       ├── devices/
│   │       ├── homes/
│   │       ├── notifications/
│   │       ├── rooms/
│   │       ├── shared/
│   │       ├── simulator/
│   │       └── main.js
│   └── frontend/
│       ├── dev-server.mjs
│       ├── index.html
│       ├── package.json
│       └── src/
├── database/
│   ├── README.md
│   ├── migrations/
│   └── seeds/
├── docs/
├── packages/
│   └── shared/
├── scripts/
└── test/
```

### Major folders

| Folder | Purpose |
| --- | --- |
| `apps/backend/` | In-memory backend application. `src/main.js` exposes `createBackendApp()` and routes request-like objects to repository/action functions. |
| `apps/backend/src/auth/` | Password verification, HMAC-signed bearer token creation/verification, login service, and auth/access guards. |
| `apps/backend/src/homes/` | Home list/read and admin-only home create/update/delete operations. |
| `apps/backend/src/rooms/` | Room list/read and admin-only room create/update/delete operations. |
| `apps/backend/src/devices/` | Device list/read, admin-only device registration/update/delete, and authenticated device action execution. |
| `apps/backend/src/device-capabilities/` | Capability-based action validation and state-transition logic for lights, heaters, and door locks. |
| `apps/backend/src/device-events/` | Device event creation and home-scoped event listing. |
| `apps/backend/src/notifications/` | Notification generation rules, notification listing/read-state updates, and preference replacement. |
| `apps/backend/src/simulator/` | Simulator helper functions for fake device actions, status changes, and heater telemetry updates. |
| `apps/backend/src/shared/` | Shared backend errors, HTTP response helpers, validation helpers, and MVP in-memory seed data. |
| `apps/frontend/` | Framework-free browser dashboard and dev server. The dev server serves static files and forwards `/auth` and `/homes` requests to the in-memory backend. |
| `database/` | SQLite schema and seed files. These are not wired into the runtime backend yet. |
| `docs/` | Source-of-truth project documentation, including scope, architecture, API contracts, data model, capabilities, notifications, and roadmap. |
| `packages/shared/` | Workspace package boundary for future cross-app utilities. Currently contains only a scaffold export. |
| `scripts/` | Repository checks: scaffold lint and simple formatting checks. |
| `test/` | Test suites using Node's built-in test runner. |

## 3. Prerequisites

| Requirement | Version / value | Why it is needed |
| --- | --- | --- |
| Node.js | `>=20` | Required by the root `package.json` engines field and by built-in APIs such as `node --test`, ESM, `fetch`, and `structuredClone`. |
| npm | Bundled with Node.js | Installs workspace dependencies and runs scripts. |
| SQLite CLI | `sqlite3` executable on `PATH` | Required by the database schema tests, which shell out to `sqlite3`. |
| Browser | Any modern browser | Required to use the local frontend demo at `http://localhost:5173`. |

### Environment variables

The repository has no checked-in `.env` file and no required environment file.

| Variable | Used by | Default | Description |
| --- | --- | --- | --- |
| `PORT` | `apps/frontend/dev-server.mjs` | `5173` | Port for the local frontend/API demo server. Example: `PORT=3000 npm run dev`. |

The backend app factory requires a `tokenSecret` argument in code when calling `createBackendApp({ tokenSecret })`. The frontend dev server supplies a hard-coded demo secret for local development. There is no documented runtime environment variable for this value yet.

### External services

No external services are required for the MVP.

### MQTT broker

No MQTT broker is required. The MVP explicitly uses simulator behavior instead of real IoT hardware or MQTT integrations.

## 4. Installation

From the repository root:

```bash
npm install
```

That command installs the npm workspace. The current workspace packages only depend on the local `@smart-home/shared` package, so installation is lightweight.

If you want to run the full test suite, also install the `sqlite3` CLI using your operating system package manager. For example, on Debian/Ubuntu-based systems:

```bash
sudo apt-get install sqlite3
```

The repository does not include a script that installs system packages.

## 5. Environment Configuration

### Local demo port

By default, the frontend dev server listens on port `5173`:

```bash
npm run dev
```

To use another port:

```bash
PORT=3000 npm run dev
```

### Auth token secret

`createBackendApp()` requires `tokenSecret` so the auth service can sign and verify bearer tokens. In the local demo, `apps/frontend/dev-server.mjs` passes a hard-coded development-only secret.

Example for tests or custom scripts:

```js
import { createBackendApp } from "./apps/backend/src/main.js";

const app = createBackendApp({ tokenSecret: "local-development-secret" });
```

Do not treat the demo secret as production-ready. There is no production deployment configuration in this MVP.

## 6. Database Setup

### Current database status

The SQLite schema and seed files exist, but the running backend uses an in-memory store from `apps/backend/src/shared/mvp-data.js`. Runtime database persistence is not yet implemented.

### Migrations

The migration file is:

```text
database/migrations/001_initial_schema.sql
```

It creates these tables:

- `users`
- `homes`
- `home_memberships`
- `rooms`
- `device_types`
- `devices`
- `device_events`
- `notifications`
- `notification_preferences`

It also defines foreign keys, check constraints, uniqueness constraints, indexes, and triggers to keep membership roles aligned with user roles.

Apply the migration manually with:

```bash
sqlite3 /tmp/smart-home-mvp.sqlite ".read database/migrations/001_initial_schema.sql"
```

### Seeding

The seed file is:

```text
database/seeds/001_mvp_seed.sql
```

Apply it after the migration:

```bash
sqlite3 /tmp/smart-home-mvp.sqlite ".read database/seeds/001_mvp_seed.sql"
```

The seed inserts one admin, two homeowners, two homes, memberships, rooms, device types, devices, seed events, seed notifications, and notification preferences.

Important difference: the SQL seed includes persisted seed events and notifications. The in-memory runtime store starts with seeded users/homes/rooms/device types/devices, but empty `deviceEvents`, `notifications`, and `notificationPreferences` arrays.

### Resetting

There is no repository script for database reset. For a local SQLite file, delete the database file and re-run the migration and seed commands:

```bash
rm -f /tmp/smart-home-mvp.sqlite
sqlite3 /tmp/smart-home-mvp.sqlite ".read database/migrations/001_initial_schema.sql"
sqlite3 /tmp/smart-home-mvp.sqlite ".read database/seeds/001_mvp_seed.sql"
```

For the demo server, restart `npm run dev`; in-memory runtime data resets on process restart.

### Common database commands

```bash
sqlite3 /tmp/smart-home-mvp.sqlite ".tables"
sqlite3 /tmp/smart-home-mvp.sqlite "SELECT id, email, role FROM users;"
sqlite3 /tmp/smart-home-mvp.sqlite "SELECT id, home_id, name FROM rooms ORDER BY home_id, id;"
sqlite3 /tmp/smart-home-mvp.sqlite "SELECT id, home_id, name, status FROM devices ORDER BY home_id, id;"
```

## 7. Running the Project

### Start the frontend and backend together

The supported local demo command is:

```bash
npm run dev
```

This runs the frontend workspace's `dev` script. It starts `apps/frontend/dev-server.mjs`, serves the static frontend, and routes API calls beginning with `/auth` or `/homes` to the in-memory backend.

Open:

```text
http://localhost:5173
```

### Start the frontend only

There is no separate frontend-only watch/build server. The frontend is plain browser JavaScript served by `apps/frontend/dev-server.mjs`.

You can run the frontend workspace script directly:

```bash
npm run dev --workspace @smart-home/frontend
```

This still starts the combined local demo server.

### Start the backend only

There is no long-running backend server script in `apps/backend/package.json`. The backend is currently exposed as an in-memory app factory, `createBackendApp()`, and is embedded by the frontend dev server and tests.

To verify the backend package imports successfully:

```bash
npm run build --workspace @smart-home/backend
```

### Start the simulator

There is no standalone simulator process or CLI command. Simulator behavior is implemented as importable functions in `apps/backend/src/simulator/service.js` and is exercised by tests and backend code paths.

## 8. Default Accounts

The in-memory backend seeds these users and passwords:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin@smarthome.local` | `admin-password` | `home_1` and `home_2` |
| Homeowner 1 | `homeowner1@smarthome.local` | `homeowner1-password` | `home_1` only |
| Homeowner 2 | `homeowner2@smarthome.local` | `homeowner2-password` | `home_2` only |

The SQL seed inserts the same users by id/email/display name/role, but it does not store password hashes because the current database schema has no password column. Login currently uses the in-memory users and PBKDF2 password hashes in `mvp-data.js`.

## 9. Testing

### Run all tests

```bash
npm test
```

The root `test` script runs:

```bash
node --test
```

### Run a single test file

Use Node's test runner directly:

```bash
node --test test/auth-access.test.mjs
```

Replace the file path with any test file in `test/`.

### Generate coverage

There is no npm script for coverage. Node's built-in test runner can collect V8 coverage with:

```bash
node --test --experimental-test-coverage
```

Because this is not wrapped in `package.json`, prefer `npm test` for the normal project check and use the coverage command only when you explicitly need coverage output.

### Other checks

```bash
npm run build
npm run lint
npm run format
```

- `npm run build` imports each workspace package that has a build script.
- `npm run lint` runs `scripts/lint-scaffold.mjs`, which verifies required files exist and package JSON files parse.
- `npm run format` runs `scripts/check-format.mjs`, which checks Markdown/JSON/JS/MJS/HTML files for a trailing newline and no tab characters.

### Test structure

| Test file | Focus |
| --- | --- |
| `test/auth-access.test.mjs` | Login, bearer token auth, role/home access controls. |
| `test/home-room-device-api.test.mjs` | Homes, rooms, devices, admin management operations, filters, and access boundaries. |
| `test/device-actions-simulator.test.mjs` | Capability validation, user/admin actions, events, simulator status, and telemetry behavior. |
| `test/notifications-api.test.mjs` | Notification generation, recipient scoping, read/unread updates, and preferences. |
| `test/frontend-dashboard.test.mjs` | Frontend rendering and helper behavior. |
| `test/end-to-end-mvp-flow.test.mjs` | End-to-end happy paths and cross-home isolation. |
| `test/database-schema.test.mjs` | SQLite migration/seed constraints and tenant isolation checks. Requires `sqlite3`. |
| `test/scaffold.test.mjs` | Basic project scaffold expectations. |

## 10. API Overview

The backend handles request-like objects through `createBackendApp().handleRequest({ method, path, query, body, headers })`. The dev server maps HTTP requests to that interface.

### Authentication

1. Call `POST /auth/login` with email and password.
2. Receive a signed bearer token and public user object.
3. Send authenticated requests with:

```http
Authorization: Bearer <token>
```

Tokens are HMAC-signed pseudo-JWTs created with Node's `crypto` module. The default token TTL is 3600 seconds in `createAuthService()`.

### Endpoints implemented

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | No bearer token required | Body: `{ "email": "...", "password": "..." }`. |
| `GET` | `/auth/me` | Required | Returns current user and accessible home ids. |
| `GET` | `/homes` | Required | Lists homes accessible to current user. |
| `POST` | `/homes` | Admin | Creates a home and admin membership. |
| `GET` | `/homes/{home_id}` | Required | Returns one accessible home. |
| `PATCH` | `/homes/{home_id}` | Admin | Updates home name. |
| `DELETE` | `/homes/{home_id}` | Admin | Deletes home and related in-memory rooms/devices/memberships. |
| `GET` | `/homes/{home_id}/rooms` | Required | Lists rooms in an accessible home. |
| `POST` | `/homes/{home_id}/rooms` | Admin | Creates a room. |
| `GET` | `/homes/{home_id}/rooms/{room_id}` | Required | Gets a room that belongs to the home. |
| `PATCH` | `/homes/{home_id}/rooms/{room_id}` | Admin | Updates room name. |
| `DELETE` | `/homes/{home_id}/rooms/{room_id}` | Admin | Deletes room and in-memory devices in that room. |
| `GET` | `/homes/{home_id}/devices` | Required | Lists devices. Optional query: `room_id`, `device_type_key`. |
| `POST` | `/homes/{home_id}/devices` | Admin | Registers a device using a valid room and MVP device type. |
| `GET` | `/homes/{home_id}/devices/{device_id}` | Required | Gets device details, state, status, and capabilities. |
| `PATCH` | `/homes/{home_id}/devices/{device_id}` | Admin | Updates device name and/or room. |
| `DELETE` | `/homes/{home_id}/devices/{device_id}` | Admin | Removes a device. |
| `POST` | `/homes/{home_id}/devices/{device_id}/actions` | Required | Executes a supported action on an online device. |
| `GET` | `/homes/{home_id}/events` | Required | Lists events. Optional query: `device_id`, `event_type`. |
| `GET` | `/homes/{home_id}/devices/{device_id}/events` | Required | Lists events for one device. |
| `GET` | `/homes/{home_id}/notifications` | Required | Lists notifications addressed to the current user for the home. |
| `PATCH` | `/homes/{home_id}/notifications/{notification_id}` | Required | Body: `{ "read": true }` or `{ "read": false }`. |
| `GET` | `/homes/{home_id}/notification-preferences` | Required | Lists current user's preferences for the home. |
| `PUT` | `/homes/{home_id}/notification-preferences` | Required | Replaces current user's preferences for the home. |

All home-scoped endpoints call authorization helpers so homeowners cannot access another home's data by changing IDs or URLs.

## 11. Device Simulator

### How it works

The simulator is not a separate process. It is a backend module with functions that mutate the same in-memory store and use the same device abstraction layer as user/admin actions.

Implemented simulator functions:

| Function | Behavior |
| --- | --- |
| `setSimulatedDeviceStatus(store, homeId, deviceId, status)` | Sets `online` or `offline`, records `status_changed` only when status changes, and creates notifications for offline transitions. |
| `applySimulatorAction(store, homeId, deviceId, action, params)` | Applies a normal capability action as source `simulator`, records events, and creates notifications. |
| `updateSimulatedTelemetry(store, homeId, deviceId, payload)` | Updates `current_temperature_c` for devices that support temperature telemetry, records `temperature_changed` when the value changes, and creates threshold-based notifications. |

### How to start it

There is no simulator CLI, daemon, scheduler, or MQTT bridge. To use simulator behavior today, import the functions in tests or development scripts.

Example:

```js
import { createMvpStore } from "./apps/backend/src/shared/mvp-data.js";
import { updateSimulatedTelemetry } from "./apps/backend/src/simulator/service.js";

const store = createMvpStore();
const result = updateSimulatedTelemetry(store, "home_1", "device_home_1_bedroom_heater", {
  current_temperature_c: 16,
});

console.log(result.event);
console.log(result.notifications);
```

### Fake device behavior

- Lights support `turn_on`, `turn_off`, and `set_brightness`.
- Heaters support `turn_on`, `turn_off`, `set_target_temperature`, and simulator telemetry for `current_temperature_c`.
- Door locks support `lock` and `unlock`.
- Offline devices reject user/admin action execution.
- Simulator status changes can mark devices offline/online.
- Heater temperature notifications are created only when the current temperature is more than 2°C away from the target.

### Replacing it with real hardware later

Future real integrations should keep the same boundary:

1. Authenticate and authorize at the backend/API layer.
2. Represent hardware capabilities with the existing capability objects.
3. Validate incoming commands with the device abstraction layer.
4. Convert hardware telemetry into device state updates.
5. Record `device_events` with `source: "simulator"` replaced by the appropriate future source only after that source is documented.
6. Let notification rules inspect events instead of having hardware adapters create notifications directly.

MQTT or hardware-specific code is not implemented yet and should not be added without updating the source-of-truth docs.

## 12. Notifications

Notifications are generated from qualifying device events and stored per recipient.

### Generation flow

1. A user/admin action or simulator function changes device state/status/telemetry.
2. The backend creates a device event with `homeId`, `deviceId`, `source`, `eventType`, previous state, and new state.
3. `createNotificationsForEvent()` finds notification details for the event type and device type.
4. Recipients are all users with a membership in the event's home.
5. Preferences are checked for each recipient.
6. Notifications are inserted into the in-memory store unless an identical event/user notification already exists.

### Event rules

| Device/event | Notification |
| --- | --- |
| Light `power_changed` | `info` when turned on/off. |
| Light `brightness_changed` | `info` when brightness changes. |
| Heater `power_changed` | `info` when turned on/off. |
| Heater `target_temperature_changed` | `info` when target changes. |
| Heater `temperature_changed` | `warning` only when current temperature differs from target by more than 2°C. |
| Door lock `lock_state_changed` to `locked` | `info`. |
| Door lock `lock_state_changed` to `unlocked` | `critical`. |
| Any supported device `status_changed` to `offline` | `warning`. |

### Preferences

Preferences are scoped by current user and home. A preference can target:

- all device types and all event types (`deviceTypeKey: null`, `eventType: null`),
- one device type and all events for that type,
- one device type and one event type.

If no matching preference exists, notifications are enabled by default. If matching preferences exist, all matching preferences must be enabled for a notification to be created. Replacing preferences removes the current user's existing preferences for the home and inserts the submitted scopes.

## 13. Troubleshooting

| Problem | Likely cause | Solution |
| --- | --- | --- |
| `npm test` fails with `spawnSync sqlite3 ENOENT` or similar | SQLite CLI is missing. | Install `sqlite3` and re-run `npm test`. |
| `npm run dev` cannot bind to port `5173` | Another process is using the port. | Run with another port, for example `PORT=3000 npm run dev`. |
| Login returns `Invalid email or password` | Incorrect demo credentials. | Use one of the seeded accounts in section 8. Emails are lower-case and passwords include hyphens. |
| API returns `Bearer token required` | Missing `Authorization` header. | Login first and send `Authorization: Bearer <token>`. |
| API returns `Home access denied` | User is trying to access a home outside their memberships. | Use admin or the homeowner assigned to that home. This is expected isolation behavior. |
| Device action returns `Device must be online to execute actions` | The device status is `offline`. | Bring it online in the in-memory store/simulator before executing user/admin actions. There is no UI for simulator status changes yet. |
| Database changes do not affect the demo UI | Runtime backend does not read SQLite yet. | Update `apps/backend/src/shared/mvp-data.js` for in-memory seed changes, or implement database persistence as a future feature. |
| Notification preference appears not to exist initially in the demo | The in-memory store starts with empty preferences. | This is current runtime behavior. Missing preferences mean notifications are enabled by default. |

## 14. Development Workflow

Recommended order for future feature work:

1. Read `README.md` and all source-of-truth docs in `docs/` before changing behavior.
2. If behavior is not documented, update the relevant doc first in the same change.
3. Start with data model changes: in-memory seed/store and SQLite migration/seed if persistence shape changes.
4. Add or update capability/action logic in `apps/backend/src/device-capabilities/` when device behavior changes.
5. Add repository or API handling in the backend, keeping home authorization at every boundary.
6. Add simulator support if the feature needs fake device behavior.
7. Add notification rules/preferences if the feature emits user-visible notifications.
8. Update frontend rendering only after backend shapes are stable.
9. Add tests for access control, validation, events, notifications, and UI helpers.
10. Run `npm run build`, `npm run lint`, `npm run format`, and `npm test` before committing.

## 15. Extending the Platform

### Add a new device type

Not currently in MVP scope. The docs explicitly limit device types to `light`, `heater`, and `door_lock`. If a future task expands scope:

1. Update `docs/MVP_SCOPE.md`, `docs/DEVICE_CAPABILITIES.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACTS.md`, and `docs/NOTIFICATIONS.md` as needed.
2. Add the device type to `mvpDeviceTypes` with capabilities and a default state.
3. Add SQL seed data in `database/seeds/001_mvp_seed.sql` and schema constraints if needed.
4. Update `MVP_DEVICE_TYPES` in notifications if preferences should allow the new type.
5. Add action validation/state transitions in `device-capabilities/actions.js`.
6. Add simulator behavior if telemetry or fake state changes are needed.
7. Add frontend controls if existing capability controls do not cover the new type.
8. Add tests before relying on the behavior.

### Add a new notification

1. Ensure the triggering device event exists or add it through capability/simulator logic.
2. Add a descriptor in `apps/backend/src/notifications/repository.js` under the correct device type/event key.
3. Confirm severity is one of `info`, `warning`, or `critical`.
4. Add tests for recipient scoping, preferences, and read/unread behavior.
5. Update `docs/NOTIFICATIONS.md` and this guide if the behavior becomes part of the maintained contract.

### Add a new capability

1. Document the capability key, state fields, actions, params, and events in `docs/DEVICE_CAPABILITIES.md`.
2. Add the capability to the relevant device type seed/default state.
3. Update `validateDeviceAction()` and `applyDeviceAction()`.
4. Update `eventForChangedField()` if new state fields should emit events.
5. Add simulator telemetry/action helpers if needed.
6. Update frontend input rendering in `capabilityActionInput()` if the action needs parameters.
7. Add backend and frontend tests.

### Add a new dashboard page

The frontend is currently a single framework-free page rendered from `apps/frontend/src/main.js`. To add a page or major panel:

1. Add API calls in `createFrontendApp()` only after the backend endpoint exists.
2. Add state fields for the data loaded by that page/panel.
3. Add rendering helpers that escape user-controlled data with `escapeHtml()`.
4. Wire form submit or click handlers through the existing delegated event listeners.
5. Add frontend helper/render tests in `test/frontend-dashboard.test.mjs` or a new test file.

## 16. Architecture Notes

- The home is the tenant boundary. Every tenant-scoped read/write must verify home access.
- The frontend can hide inaccessible data, but it is not a security boundary. Backend guards must enforce access.
- Device-specific behavior belongs in the device abstraction layer, not scattered through API routes or UI code.
- The backend currently uses an in-memory store for fast MVP iteration and deterministic tests.
- SQLite schema/seed files document the target relational model but are not yet connected to the runtime backend.
- Notifications are derived from device events. Actions and simulator updates should create events first, then notifications.
- Preferences suppress notification creation; they do not filter already-created notifications.
- Notification delivery is record-only. Email, SMS, push, and other external delivery channels are intentionally excluded.
- The simulator stands in for real IoT integrations and must use the same device capability contract as future hardware adapters.
- The shared package is intentionally minimal. Use it when code is genuinely shared across frontend/backend, not as a dumping ground.

## 17. Future Roadmap

Logical next features after the MVP include:

- Persist the backend to SQLite or another database instead of using only the in-memory store.
- Add a real backend server entry point separate from the frontend demo server.
- Add migration and reset npm scripts once runtime persistence exists.
- Add a simulator CLI or scheduler for periodic fake telemetry/status changes.
- Add admin UI for rooms and device registration/update/delete.
- Add better event and notification filtering in the frontend.
- Add comprehensive coverage reporting as a package script.
- Add production-grade secret/config management for auth tokens.
- Add real IoT integration only after documenting protocols, security, source values, retry behavior, and failure modes.
- Add external notification delivery providers only after extending the notification docs and preference model.
