import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBackendApp } from "../apps/backend/src/main.js";
import { requireAdmin, requireHomeAccess } from "../apps/backend/src/auth/guards.js";
import { AuthError, ForbiddenError } from "../apps/backend/src/shared/errors.js";

const tokenSecret = "test-only-token-secret-with-enough-entropy";

function login(app, email, password) {
  return app.handleRequest({
    method: "POST",
    path: "/auth/login",
    body: { email, password },
  });
}

function get(app, path, token) {
  return app.handleRequest({
    method: "GET",
    path,
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("authentication and home access", () => {
  it("logs in the admin and returns a bearer token plus public user", () => {
    const app = createBackendApp({ tokenSecret });
    const response = login(app, "admin@smarthome.local", "admin-password");

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.token, "string");
    assert.deepEqual(response.body.user, {
      id: "user_admin",
      email: "admin@smarthome.local",
      displayName: "MVP Admin",
      role: "admin",
    });
  });

  it("logs in a homeowner and exposes only that homeowner identity", () => {
    const app = createBackendApp({ tokenSecret });
    const response = login(app, "homeowner1@smarthome.local", "homeowner1-password");

    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, "user_homeowner_1");
    assert.equal(response.body.user.role, "homeowner");
    assert.equal(response.body.user.passwordHash, undefined);
  });

  it("rejects invalid login attempts", () => {
    const app = createBackendApp({ tokenSecret });
    const response = login(app, "homeowner1@smarthome.local", "wrong-password");

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: "Invalid email or password" });
  });

  it("returns current user details and accessible homes from /auth/me", () => {
    const app = createBackendApp({ tokenSecret });
    const { token } = login(app, "homeowner1@smarthome.local", "homeowner1-password").body;
    const response = get(app, "/auth/me", token);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.user.accessibleHomeIds, ["home_1"]);
  });

  it("allows admins to access all homes", () => {
    const app = createBackendApp({ tokenSecret });
    const { token } = login(app, "admin@smarthome.local", "admin-password").body;
    const response = get(app, "/homes", token);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.homes.map((home) => home.id),
      ["home_1", "home_2"],
    );
  });

  it("enforces admin-only guard behavior", () => {
    const app = createBackendApp({ tokenSecret });
    const adminToken = login(app, "admin@smarthome.local", "admin-password").body.token;
    const homeownerToken = login(app, "homeowner1@smarthome.local", "homeowner1-password").body.token;
    const admin = app.auth.me(`Bearer ${adminToken}`);
    const homeowner = app.auth.me(`Bearer ${homeownerToken}`);

    assert.equal(requireAdmin(admin), admin);
    assert.throws(() => requireAdmin(homeowner), ForbiddenError);
  });

  it("limits homeowners to their assigned home list", () => {
    const app = createBackendApp({ tokenSecret });
    const { token } = login(app, "homeowner2@smarthome.local", "homeowner2-password").body;
    const response = get(app, "/homes", token);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.homes, [{ id: "home_2", name: "Home 2" }]);
  });

  it("forbids cross-home access when a homeowner changes the home id", () => {
    const app = createBackendApp({ tokenSecret });
    const { token } = login(app, "homeowner1@smarthome.local", "homeowner1-password").body;
    const allowedResponse = get(app, "/homes/home_1", token);
    const forbiddenResponse = get(app, "/homes/home_2", token);

    assert.equal(allowedResponse.status, 200);
    assert.deepEqual(allowedResponse.body.home, { id: "home_1", name: "Home 1" });
    assert.equal(forbiddenResponse.status, 403);
    assert.deepEqual(forbiddenResponse.body, { error: "Home access denied" });
  });

  it("rejects protected routes without a valid bearer token", () => {
    const app = createBackendApp({ tokenSecret });
    const response = app.handleRequest({ method: "GET", path: "/homes", headers: {} });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: "Bearer token required" });
    assert.throws(() => app.auth.me("Bearer tampered-token"), AuthError);
  });

  it("exposes reusable home access guards for route handlers", () => {
    const app = createBackendApp({ tokenSecret });
    const homeownerToken = login(app, "homeowner1@smarthome.local", "homeowner1-password").body.token;
    const homeowner = app.auth.me(`Bearer ${homeownerToken}`);

    assert.equal(requireHomeAccess(app.store, homeowner, "home_1"), homeowner);
    assert.throws(() => requireHomeAccess(app.store, homeowner, "home_2"), ForbiddenError);
  });
});
