import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "README.md",
  "docs/CODEX_RULES.md",
  "docs/PROJECT_BRIEF.md",
  "docs/MVP_SCOPE.md",
  "docs/ARCHITECTURE.md",
  "docs/DATA_MODEL.md",
  "docs/API_CONTRACTS.md",
  "docs/DEVICE_CAPABILITIES.md",
  "docs/NOTIFICATIONS.md",
  "docs/ROADMAP.md",
  "apps/backend/package.json",
  "apps/frontend/package.json",
  "packages/shared/package.json",
  "database/README.md",
  "database/migrations/001_initial_schema.sql",
  "database/seeds/001_mvp_seed.sql",
  "apps/backend/src/auth/passwords.js",
  "apps/backend/src/auth/tokens.js",
  "apps/backend/src/auth/service.js",
  "apps/backend/src/auth/guards.js",
  "apps/backend/src/homes/repository.js",
  "apps/backend/src/rooms/repository.js",
  "apps/backend/src/devices/repository.js",
  "apps/backend/src/device-capabilities/actions.js",
  "apps/backend/src/device-events/repository.js",
  "apps/backend/src/devices/actions.js",
  "apps/backend/src/notifications/repository.js",
  "apps/backend/src/simulator/service.js",
  "apps/frontend/dev-server.mjs",
  "apps/backend/src/shared/errors.js",
  "apps/backend/src/shared/http.js",
  "apps/backend/src/shared/mvp-data.js",
  "apps/backend/src/shared/validation.js",
  "test/auth-access.test.mjs",
  "test/home-room-device-api.test.mjs",
  "test/device-actions-simulator.test.mjs",
  "test/notifications-api.test.mjs",
  "test/frontend-dashboard.test.mjs",
  "test/end-to-end-mvp-flow.test.mjs",
];

for (const file of requiredFiles) {
  assert.equal(existsSync(file), true, `${file} should exist`);
}

for (const file of requiredFiles.filter((file) => file.endsWith(".json"))) {
  JSON.parse(readFileSync(file, "utf8"));
}

console.log("Scaffold lint checks passed.");
