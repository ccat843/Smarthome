import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";
import { createNotificationsForEvent } from "../apps/backend/src/notifications/repository.js";
import { setSimulatedDeviceStatus, updateSimulatedTelemetry } from "../apps/backend/src/simulator/service.js";

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

function appWithLogin(email = "admin@smarthome.local", password = "admin-password") {
  const app = createBackendApp({ tokenSecret });
  const loginResponse = request(app, "POST", "/auth/login", { body: { email, password } });
  return { app, token: loginResponse.body.token };
}

function login(app, email, password) {
  return request(app, "POST", "/auth/login", { body: { email, password } }).body.token;
}

describe("notifications API", () => {
  it("creates human-readable notifications for door unlocked events scoped to recipients", () => {
    const { app, token: adminToken } = appWithLogin();
    const homeownerToken = login(app, "homeowner1@smarthome.local", "homeowner1-password");
    const otherHomeownerToken = login(app, "homeowner2@smarthome.local", "homeowner2-password");

    const action = request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token: adminToken,
      body: { action: "unlock", params: {} },
    });
    const adminNotifications = request(app, "GET", "/homes/home_1/notifications", { token: adminToken });
    const homeownerNotifications = request(app, "GET", "/homes/home_1/notifications", {
      token: homeownerToken,
    });
    const otherHomeNotifications = request(app, "GET", "/homes/home_2/notifications", {
      token: otherHomeownerToken,
    });

    assert.equal(action.status, 200);
    assert.equal(action.body.notifications.length, 2);
    assert.equal(action.body.notifications.every((notification) => notification.homeId === "home_1"), true);
    assert.equal(action.body.notifications.every((notification) => notification.deviceId === "device_home_1_front_door"), true);
    assert.equal(adminNotifications.body.notifications.length, 1);
    assert.equal(homeownerNotifications.body.notifications.length, 1);
    assert.equal(otherHomeNotifications.body.notifications.length, 0);
    assert.equal(adminNotifications.body.notifications[0].title, "Front Door unlocked");
    assert.equal(adminNotifications.body.notifications[0].severity, "critical");
  });

  it("creates notifications for device offline events", () => {
    const { app, token } = appWithLogin();
    const result = setSimulatedDeviceStatus(app.store, "home_1", "device_home_1_living_light", "offline");
    const notifications = request(app, "GET", "/homes/home_1/notifications", { token });

    assert.equal(result.notifications.length, 2);
    assert.equal(result.notifications[0].severity, "warning");
    assert.equal(result.notifications[0].title, "Living Room Light offline");
    assert.equal(notifications.body.notifications.length, 1);
    assert.equal(notifications.body.notifications[0].message, "Living Room Light in Home 1 went offline.");
  });

  it("only creates heater temperature notifications when current temperature exceeds the threshold", () => {
    const { app, token } = appWithLogin();
    const withinThreshold = updateSimulatedTelemetry(app.store, "home_1", "device_home_1_bedroom_heater", {
      current_temperature_c: 19,
    });
    const overThreshold = updateSimulatedTelemetry(app.store, "home_1", "device_home_1_bedroom_heater", {
      current_temperature_c: 18,
    });
    const notifications = request(app, "GET", "/homes/home_1/notifications", { token });

    assert.equal(withinThreshold.notifications.length, 0);
    assert.equal(overThreshold.notifications.length, 2);
    assert.equal(notifications.body.notifications[0].title, "Bedroom Heater temperature warning");
    assert.equal(notifications.body.notifications[0].severity, "warning");
  });

  it("honors notification preferences for light state changes", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const preferences = request(app, "PUT", "/homes/home_1/notification-preferences", {
      token,
      body: {
        preferences: [{ device_type_key: "light", event_type: "power_changed", enabled: false }],
      },
    });
    const off = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "turn_off", params: {} },
    });
    const listed = request(app, "GET", "/homes/home_1/notification-preferences", { token });
    const notifications = request(app, "GET", "/homes/home_1/notifications", { token });

    assert.equal(preferences.status, 200);
    assert.equal(preferences.body.preferences.length, 1);
    assert.equal(listed.body.preferences[0].deviceTypeKey, "light");
    assert.equal(listed.body.preferences[0].enabled, false);
    assert.equal(off.body.notifications.length, 1);
    assert.equal(off.body.notifications[0].userId, "user_admin");
    assert.equal(notifications.body.notifications.length, 0);
  });

  it("marks notifications read and unread for the addressed user only", () => {
    const { app, token: adminToken } = appWithLogin();
    const homeownerToken = login(app, "homeowner1@smarthome.local", "homeowner1-password");
    request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token: adminToken,
      body: { action: "unlock", params: {} },
    });
    const [notification] = request(app, "GET", "/homes/home_1/notifications", {
      token: homeownerToken,
    }).body.notifications;

    const read = request(app, "PATCH", `/homes/home_1/notifications/${notification.id}`, {
      token: homeownerToken,
      body: { read: true },
    });
    const unread = request(app, "PATCH", `/homes/home_1/notifications/${notification.id}`, {
      token: homeownerToken,
      body: { read: false },
    });
    const adminCannotPatchHomeownerNotification = request(
      app,
      "PATCH",
      `/homes/home_1/notifications/${notification.id}`,
      { token: adminToken, body: { read: true } },
    );

    assert.equal(read.status, 200);
    assert.equal(typeof read.body.notification.readAt, "string");
    assert.equal(unread.status, 200);
    assert.equal(unread.body.notification.readAt, null);
    assert.equal(adminCannotPatchHomeownerNotification.status, 404);
  });

  it("forbids cross-home notification and preference access", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const notifications = request(app, "GET", "/homes/home_2/notifications", { token });
    const preferencesRead = request(app, "GET", "/homes/home_2/notification-preferences", { token });
    const preferencesWrite = request(app, "PUT", "/homes/home_2/notification-preferences", {
      token,
      body: { preferences: [{ device_type_key: "light", event_type: null, enabled: false }] },
    });

    assert.equal(notifications.status, 403);
    assert.deepEqual(notifications.body, { error: "Home access denied" });
    assert.equal(preferencesRead.status, 403);
    assert.equal(preferencesWrite.status, 403);
  });

  it("validates preference payloads and avoids duplicate notification generation", () => {
    const { app, token } = appWithLogin();
    const invalidType = request(app, "PUT", "/homes/home_1/notification-preferences", {
      token,
      body: { preferences: [{ device_type_key: "camera", event_type: null, enabled: true }] },
    });
    const duplicateScope = request(app, "PUT", "/homes/home_1/notification-preferences", {
      token,
      body: {
        preferences: [
          { device_type_key: null, event_type: null, enabled: true },
          { device_type_key: null, event_type: null, enabled: false },
        ],
      },
    });

    const result = setSimulatedDeviceStatus(app.store, "home_1", "device_home_1_living_light", "offline");
    const regenerated = createNotificationsForEvent(app.store, result.events[0]);
    const duplicateAttempt = result.events.flatMap((event) =>
      app.store.notifications.filter((notification) => notification.deviceEventId === event.id),
    );

    assert.equal(invalidType.status, 400);
    assert.equal(duplicateScope.status, 400);
    assert.equal(regenerated.length, 0);
    assert.equal(duplicateAttempt.length, 2);
  });
});
