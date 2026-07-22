import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";

const tokenSecret = "test-only-token-secret-with-enough-entropy";

function appWithLogin(email = "admin@smarthome.local", password = "admin-password") {
  const app = createBackendApp({ tokenSecret });
  const loginResponse = request(app, "POST", "/auth/login", { body: { email, password } });
  return { app, token: loginResponse.body.token };
}

function request(app, method, path, { token, body, query } = {}) {
  return app.handleRequest({
    method,
    path,
    body,
    query,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe("home, room, and device management API", () => {
  it("allows an admin to create a home", () => {
    const { app, token } = appWithLogin();
    const response = request(app, "POST", "/homes", { token, body: { name: "Home 3" } });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.home, { id: "home_3", name: "Home 3" });
  });

  it("allows an admin to create a room inside an accessible home", () => {
    const { app, token } = appWithLogin();
    const response = request(app, "POST", "/homes/home_1/rooms", {
      token,
      body: { name: "Office" },
    });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.room, { id: "room_7", homeId: "home_1", name: "Office" });
  });

  it("allows an admin to add a supported device with generic capabilities", () => {
    const { app, token } = appWithLogin();
    const response = request(app, "POST", "/homes/home_1/devices", {
      token,
      body: {
        room_id: "room_home_1_living",
        device_type_key: "light",
        name: "Desk Light",
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.device.id, "device_7");
    assert.equal(response.body.device.deviceTypeKey, "light");
    assert.deepEqual(response.body.device.capabilities, [
      { key: "power", actions: ["turn_on", "turn_off", "set_brightness"], state_fields: ["power", "brightness"] },
    ]);
    assert.deepEqual(response.body.device.state, { power: "off", brightness: 0 });
  });

  it("lists devices by home and never includes another home's devices", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const response = request(app, "GET", "/homes/home_1/devices", { token });

    assert.equal(response.status, 200);
    assert.equal(response.body.devices.length, 3);
    assert.equal(response.body.devices.every((device) => device.homeId === "home_1"), true);
  });

  it("forbids cross-home room and device access by changing IDs", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const roomsResponse = request(app, "GET", "/homes/home_2/rooms", { token });
    const devicesResponse = request(app, "GET", "/homes/home_2/devices", { token });

    assert.equal(roomsResponse.status, 403);
    assert.deepEqual(roomsResponse.body, { error: "Home access denied" });
    assert.equal(devicesResponse.status, 403);
    assert.deepEqual(devicesResponse.body, { error: "Home access denied" });
  });

  it("allows homeowners to read but not manage their home resources", () => {
    const { app, token } = appWithLogin("homeowner1@smarthome.local", "homeowner1-password");
    const readResponse = request(app, "GET", "/homes/home_1/rooms", { token });
    const createResponse = request(app, "POST", "/homes/home_1/rooms", {
      token,
      body: { name: "Denied Room" },
    });

    assert.equal(readResponse.status, 200);
    assert.equal(createResponse.status, 403);
    assert.deepEqual(createResponse.body, { error: "Admin access required" });
  });

  it("validates required device fields and device type data", () => {
    const { app, token } = appWithLogin();
    const missingName = request(app, "POST", "/homes/home_1/devices", {
      token,
      body: { room_id: "room_home_1_living", device_type_key: "light" },
    });
    const unsupportedType = request(app, "POST", "/homes/home_1/devices", {
      token,
      body: {
        name: "Unsupported",
        room_id: "room_home_1_living",
        device_type_key: "camera",
      },
    });
    const wrongRoom = request(app, "POST", "/homes/home_1/devices", {
      token,
      body: {
        name: "Wrong Room",
        room_id: "room_home_2_living",
        device_type_key: "light",
      },
    });

    assert.equal(missingName.status, 400);
    assert.deepEqual(missingName.body, { error: "name is required" });
    assert.equal(unsupportedType.status, 400);
    assert.deepEqual(unsupportedType.body, {
      error: "device_type_key must be one of light, heater, or door_lock",
    });
    assert.equal(wrongRoom.status, 400);
    assert.deepEqual(wrongRoom.body, { error: "room_id must belong to the requested home" });
  });

  it("allows admins to remove a device from any home", () => {
    const { app, token } = appWithLogin();
    const removed = request(app, "DELETE", "/homes/home_2/devices/device_home_2_living_light", {
      token,
    });
    const listed = request(app, "GET", "/homes/home_2/devices", { token });

    assert.equal(removed.status, 200);
    assert.equal(removed.body.device.id, "device_home_2_living_light");
    assert.equal(
      listed.body.devices.some((device) => device.id === "device_home_2_living_light"),
      false,
    );
  });
});
