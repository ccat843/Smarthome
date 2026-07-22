import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";
import { actionLabel, createFrontendApp, paramsForAction, renderApp, visibleHomesForUser } from "../apps/frontend/src/main.js";

function form(values) {
  return { get: (key) => values[key] };
}

describe("frontend dashboard rendering helpers", () => {
  it("keeps homeowner home choices limited to accessible homes", () => {
    const user = { role: "homeowner", accessibleHomeIds: ["home_1"] };
    const homes = [
      { id: "home_1", name: "Home 1" },
      { id: "home_2", name: "Home 2" },
    ];

    assert.deepEqual(visibleHomesForUser(user, homes), [{ id: "home_1", name: "Home 1" }]);
  });

  it("renders role-specific dashboard labels and selected home data", () => {
    const html = renderApp({
      loading: false,
      error: null,
      message: null,
      user: { displayName: "Homeowner 1", role: "homeowner" },
      homes: [{ id: "home_1", name: "Home 1" }],
      selectedHomeId: "home_1",
      rooms: [],
      devices: [],
      events: [],
      notifications: [],
      preferences: [],
    });

    assert.match(html, /Homeowner dashboard/);
    assert.match(html, /Home 1/);
    assert.doesNotMatch(html, /Home 2/);
    assert.match(html, /No devices are configured/);
  });

  it("renders capability-based controls from device capability actions", () => {
    const html = renderApp({
      loading: false,
      error: null,
      message: null,
      user: { displayName: "MVP Admin", role: "admin" },
      homes: [{ id: "home_1", name: "Home 1" }],
      selectedHomeId: "home_1",
      rooms: [],
      devices: [
        {
          id: "device_home_1_living_light",
          name: "Living Room Light",
          deviceTypeKey: "light",
          status: "online",
          state: { power: "on", brightness: 80 },
          capabilities: [{ key: "power", actions: ["turn_off", "set_brightness"] }],
        },
      ],
      events: [],
      notifications: [],
      preferences: [],
    });

    assert.match(html, /Admin dashboard/);
    assert.match(html, /Device management/);
    assert.match(html, /Update home/);
    assert.match(html, /data-action="turn_off"/);
    assert.match(html, /data-action="set_brightness"/);
    assert.match(html, /name="brightness"/);
  });

  it("loads authenticated homeowner data through the API adapter without cross-home data", async () => {
    const backend = createBackendApp({ tokenSecret: "frontend-flow-test-secret-with-enough-entropy" });
    const root = { innerHTML: "", addEventListener() {} };
    const api = {
      async request(method, path, options = {}) {
        return backend.handleRequest({
          method,
          path,
          body: options.body,
          query: options.query,
          headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
        });
      },
    };

    const app = createFrontendApp({ root, api });
    await app.login("homeowner1@smarthome.local", "homeowner1-password");

    assert.equal(app.state.user.role, "homeowner");
    assert.deepEqual(app.state.homes.map((home) => home.id), ["home_1"]);
    assert.equal(app.state.devices.every((device) => device.homeId === "home_1"), true);
    assert.doesNotMatch(root.innerHTML, /home_2/);
  });

  it("maps action form fields to documented action params", () => {
    assert.equal(actionLabel("set_target_temperature"), "Set Target Temperature");
    assert.deepEqual(paramsForAction("set_brightness", form({ brightness: "42" })), { brightness: 42 });
    assert.deepEqual(paramsForAction("set_target_temperature", form({ target_temperature_c: "22.5" })), {
      target_temperature_c: 22.5,
    });
    assert.deepEqual(paramsForAction("turn_on", form({})), {});
  });

  it("renders loading, error, notifications, and preferences states", () => {
    assert.match(renderApp({ loading: true }), /Loading smart home data/);

    const html = renderApp({
      loading: false,
      error: "Home access denied",
      message: "Preferences saved",
      user: { displayName: "MVP Admin", role: "admin" },
      homes: [{ id: "home_1", name: "Home 1" }],
      selectedHomeId: "home_1",
      rooms: [],
      devices: [],
      events: [],
      notifications: [
        {
          id: "notification_1",
          title: "Front Door unlocked",
          message: "Front Door in Home 1 was unlocked.",
          severity: "critical",
          readAt: null,
        },
      ],
      preferences: [{ deviceTypeKey: "light", eventType: "power_changed", enabled: false }],
    });

    assert.match(html, /Home access denied/);
    assert.match(html, /Preferences saved/);
    assert.match(html, /Front Door unlocked/);
    assert.match(html, /Notification preferences/);
  });
});
