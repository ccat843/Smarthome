import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";

const tokenSecret = "test-only-token-secret-with-enough-entropy";

function request(app, method, path, { token, body, query } = {}) {
  return app.handleRequest({
    method,
    path,
    body,
    query,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function login(app, email, password) {
  const response = request(app, "POST", "/auth/login", { body: { email, password } });
  assert.equal(response.status, 200);
  return response.body.token;
}

describe("end-to-end MVP demo flows", () => {
  it("runs admin and homeowner device, event, notification, and preference flows with home isolation", () => {
    const app = createBackendApp({ tokenSecret });
    const adminToken = login(app, "admin@smarthome.local", "admin-password");
    const homeowner1Token = login(app, "homeowner1@smarthome.local", "homeowner1-password");
    const homeowner2Token = login(app, "homeowner2@smarthome.local", "homeowner2-password");

    const adminHomes = request(app, "GET", "/homes", { token: adminToken });
    const homeownerHomes = request(app, "GET", "/homes", { token: homeowner1Token });
    assert.deepEqual(adminHomes.body.homes.map((home) => home.id), ["home_1", "home_2"]);
    assert.deepEqual(homeownerHomes.body.homes.map((home) => home.id), ["home_1"]);

    const disabledPreference = request(app, "PUT", "/homes/home_1/notification-preferences", {
      token: homeowner1Token,
      body: { preferences: [{ device_type_key: "door_lock", event_type: "lock_state_changed", enabled: false }] },
    });
    assert.equal(disabledPreference.status, 200);

    const unlock = request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token: adminToken,
      body: { action: "unlock", params: {} },
    });
    assert.equal(unlock.status, 200);
    assert.equal(unlock.body.device.state.lock_state, "unlocked");
    assert.equal(unlock.body.events[0].homeId, "home_1");
    assert.equal(unlock.body.notifications.length, 1);
    assert.equal(unlock.body.notifications[0].userId, "user_admin");

    const adminNotifications = request(app, "GET", "/homes/home_1/notifications", { token: adminToken });
    const homeownerNotifications = request(app, "GET", "/homes/home_1/notifications", { token: homeowner1Token });
    const crossHomeNotifications = request(app, "GET", "/homes/home_1/notifications", { token: homeowner2Token });
    assert.equal(adminNotifications.body.notifications.length, 1);
    assert.equal(homeownerNotifications.body.notifications.length, 0);
    assert.equal(crossHomeNotifications.status, 403);

    const events = request(app, "GET", "/homes/home_1/events", { token: homeowner1Token });
    assert.equal(events.status, 200);
    assert.equal(events.body.events.length, 1);
    assert.equal(events.body.events[0].deviceId, "device_home_1_front_door");
  });
});
