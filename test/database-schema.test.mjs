import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir;

function createSeededDatabase() {
  tempDir = mkdtempSync(join(tmpdir(), "smart-home-mvp-"));
  const dbPath = join(tempDir, "mvp.sqlite");
  execFileSync("sqlite3", [dbPath, ".read database/migrations/001_initial_schema.sql"]);
  execFileSync("sqlite3", [dbPath, ".read database/seeds/001_mvp_seed.sql"]);
  return dbPath;
}

function query(dbPath, sql) {
  return execFileSync("sqlite3", ["-json", dbPath, sql], { encoding: "utf8" }).trim();
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("database schema and MVP seed data", () => {
  it("creates the documented MVP tables", () => {
    const dbPath = createSeededDatabase();
    const tables = JSON.parse(
      query(
        dbPath,
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;",
      ),
    ).map((row) => row.name);

    assert.deepEqual(tables, [
      "device_events",
      "device_types",
      "devices",
      "home_memberships",
      "homes",
      "notification_preferences",
      "notifications",
      "rooms",
      "users",
    ]);
  });

  it("seeds exactly two homes, one admin, two homeowners, and three device types", () => {
    const dbPath = createSeededDatabase();
    const [counts] = JSON.parse(
      query(
        dbPath,
        `SELECT
          (SELECT COUNT(*) FROM homes) AS homes,
          (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
          (SELECT COUNT(*) FROM users WHERE role = 'homeowner') AS homeowners,
          (SELECT COUNT(*) FROM device_types) AS device_types;`,
      ),
    );

    assert.deepEqual(counts, {
      homes: 2,
      admins: 1,
      homeowners: 2,
      device_types: 3,
    });
  });

  it("keeps homeowners assigned to exactly one home", () => {
    const dbPath = createSeededDatabase();
    const rows = JSON.parse(
      query(
        dbPath,
        `SELECT users.id, COUNT(home_memberships.home_id) AS home_count
         FROM users
         JOIN home_memberships ON home_memberships.user_id = users.id
         WHERE users.role = 'homeowner'
         GROUP BY users.id
         ORDER BY users.id;`,
      ),
    );

    assert.deepEqual(rows, [
      { id: "user_homeowner_1", home_count: 1 },
      { id: "user_homeowner_2", home_count: 1 },
    ]);
  });

  it("rejects devices assigned to rooms from another home", () => {
    const dbPath = createSeededDatabase();

    assert.throws(() => {
      execFileSync(
        "sqlite3",
        [
          dbPath,
          `PRAGMA foreign_keys = ON;
           INSERT INTO devices (id, home_id, room_id, device_type_id, name, state, status)
           VALUES ('bad_device', 'home_1', 'room_home_2_living', 'device_type_light', 'Bad Device', '{"power":"off"}', 'online');`,
        ],
        { stdio: "ignore" },
      );
    });
  });

  it("rejects notifications tied to events from another home", () => {
    const dbPath = createSeededDatabase();

    assert.throws(() => {
      execFileSync(
        "sqlite3",
        [
          dbPath,
          `PRAGMA foreign_keys = ON;
           INSERT INTO notifications (id, home_id, device_id, device_event_id, user_id, title, message, severity)
           VALUES ('bad_notification', 'home_1', 'device_home_1_living_light', 'event_home_2_lock_unlocked', 'user_homeowner_1', 'Bad', 'Bad cross-home notification', 'info');`,
        ],
        { stdio: "ignore" },
      );
    });
  });

  it("rejects notifications for users who are not members of the notification home", () => {
    const dbPath = createSeededDatabase();

    assert.throws(() => {
      execFileSync(
        "sqlite3",
        [
          dbPath,
          `PRAGMA foreign_keys = ON;
           INSERT INTO notifications (id, home_id, device_id, device_event_id, user_id, title, message, severity)
           VALUES ('bad_user_notification', 'home_1', 'device_home_1_living_light', 'event_home_1_light_turned_on', 'user_homeowner_2', 'Bad', 'Bad recipient notification', 'info');`,
        ],
        { stdio: "ignore" },
      );
    });
  });

  it("rejects notification preferences for homes the user cannot access", () => {
    const dbPath = createSeededDatabase();

    assert.throws(() => {
      execFileSync(
        "sqlite3",
        [
          dbPath,
          `PRAGMA foreign_keys = ON;
           INSERT INTO notification_preferences (id, user_id, home_id, device_type_key, event_type, enabled)
           VALUES ('bad_preference', 'user_homeowner_1', 'home_2', NULL, NULL, 1);`,
        ],
        { stdio: "ignore" },
      );
    });
  });
});
