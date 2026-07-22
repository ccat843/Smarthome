import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";
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

describe("device actions and simulator", () => {
  it("executes light power actions and records events", () => {
    const { app, token } = appWithLogin();
    const off = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "turn_off", params: {} },
    });
    const on = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "TURN_ON", params: {} },
    });

    assert.equal(off.status, 200);
    assert.equal(off.body.device.state.power, "off");
    assert.equal(off.body.events[0].eventType, "power_changed");
    assert.equal(off.body.events[0].homeId, "home_1");
    assert.equal(off.body.events[0].deviceId, "device_home_1_living_light");
    assert.equal(on.body.device.state.power, "on");

    const brightness = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "SET_BRIGHTNESS", params: { brightness: 35 } },
    });
    assert.equal(brightness.status, 200);
    assert.equal(brightness.body.device.state.brightness, 35);
    assert.equal(brightness.body.events[0].eventType, "brightness_changed");
  });

  it("executes heater power and temperature actions", () => {
    const { app, token } = appWithLogin();
    const power = request(app, "POST", "/homes/home_1/devices/device_home_1_bedroom_heater/actions", {
      token,
      body: { action: "turn_on", params: {} },
    });
    const temp = request(app, "POST", "/homes/home_1/devices/device_home_1_bedroom_heater/actions", {
      token,
      body: { action: "SET_TEMPERATURE", params: { target_temperature_c: 22 } },
    });

    assert.equal(power.status, 200);
    assert.equal(power.body.device.state.power, "on");
    assert.equal(power.body.events[0].eventType, "power_changed");
    assert.equal(temp.status, 200);
    assert.equal(temp.body.device.state.target_temperature_c, 22);
    assert.equal(temp.body.events[0].eventType, "target_temperature_changed");
  });

  it("executes door lock actions", () => {
    const { app, token } = appWithLogin();
    const unlock = request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token,
      body: { action: "unlock", params: {} },
    });
    const lock = request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token,
      body: { action: "LOCK", params: {} },
    });

    assert.equal(unlock.status, 200);
    assert.equal(unlock.body.device.state.lock_state, "unlocked");
    assert.equal(unlock.body.events[0].eventType, "lock_state_changed");
    assert.equal(lock.body.device.state.lock_state, "locked");
  });

  it("lists home- and device-scoped events", () => {
    const { app, token } = appWithLogin();
    request(app, "POST", "/homes/home_1/devices/device_home_1_front_door/actions", {
      token,
      body: { action: "unlock", params: {} },
    });

    const homeEvents = request(app, "GET", "/homes/home_1/events", { token });
    const deviceEvents = request(app, "GET", "/homes/home_1/devices/device_home_1_front_door/events", { token });

    assert.equal(homeEvents.status, 200);
    assert.equal(homeEvents.body.events.length, 1);
    assert.equal(deviceEvents.body.events.length, 1);
    assert.equal(deviceEvents.body.events[0].homeId, "home_1");
  });

  it("updates simulator online/offline status and heater telemetry", () => {
    const { app } = appWithLogin();
    const status = setSimulatedDeviceStatus(app.store, "home_1", "device_home_1_living_light", "offline");
    const telemetry = updateSimulatedTelemetry(app.store, "home_1", "device_home_1_bedroom_heater", {
      current_temperature_c: 19,
    });

    assert.equal(status.device.status, "offline");
    assert.equal(status.events[0].eventType, "status_changed");
    assert.equal(telemetry.device.state.current_temperature_c, 19);
    assert.equal(telemetry.event.eventType, "temperature_changed");
  });

  it("rejects invalid, unsupported, and offline actions", () => {
    const { app, token } = appWithLogin();
    const unsupported = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "set_target_temperature", params: { target_temperature_c: 22 } },
    });
    const invalidParams = request(app, "POST", "/homes/home_1/devices/device_home_1_bedroom_heater/actions", {
      token,
      body: { action: "set_target_temperature", params: { target_temperature_c: "warm" } },
    });
    setSimulatedDeviceStatus(app.store, "home_1", "device_home_1_living_light", "offline");
    const offline = request(app, "POST", "/homes/home_1/devices/device_home_1_living_light/actions", {
      token,
      body: { action: "turn_on", params: {} },
    });

    assert.equal(unsupported.status, 400);
    assert.equal(invalidParams.status, 400);
    assert.equal(offline.status, 400);
  });

  it("enforces access control on device actions and event reads", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const forbiddenAction = request(app, "POST", "/homes/home_2/devices/device_home_2_living_light/actions", {
      token,
      body: { action: "turn_on", params: {} },
    });
    const forbiddenEvents = request(app, "GET", "/homes/home_2/events", { token });

    assert.equal(forbiddenAction.status, 403);
    assert.deepEqual(forbiddenAction.body, { error: "Home access denied" });
    assert.equal(forbiddenEvents.status, 403);
  });
});
