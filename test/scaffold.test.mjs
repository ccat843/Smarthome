import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const requiredPaths = [
  "apps/backend/src/auth",
  "apps/backend/src/homes",
  "apps/backend/src/rooms",
  "apps/backend/src/devices",
  "apps/backend/src/notifications",
  "apps/backend/src/device-events",
  "apps/backend/src/device-capabilities",
  "apps/backend/src/simulator",
  "apps/frontend/src/auth",
  "apps/frontend/src/homes",
  "apps/frontend/src/rooms",
  "apps/frontend/src/devices",
  "apps/frontend/src/notifications",
  "apps/frontend/src/device-events",
  "apps/frontend/src/device-capabilities",
  "apps/frontend/src/simulator",
  "packages/shared/src/common",
];

describe("project scaffold", () => {
  it("contains the MVP placeholder module folders", () => {
    for (const path of requiredPaths) {
      assert.equal(existsSync(path), true, `${path} should exist`);
    }
  });
});
