PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'homeowner')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE homes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE home_memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  home_role TEXT NOT NULL CHECK (home_role IN ('admin', 'homeowner')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, home_id)
);

CREATE TRIGGER home_memberships_role_matches_user_insert
BEFORE INSERT ON home_memberships
FOR EACH ROW
WHEN NEW.home_role != (SELECT role FROM users WHERE id = NEW.user_id)
BEGIN
  SELECT RAISE(ABORT, 'home membership role must match user role');
END;

CREATE TRIGGER home_memberships_role_matches_user_update
BEFORE UPDATE OF user_id, home_role ON home_memberships
FOR EACH ROW
WHEN NEW.home_role != (SELECT role FROM users WHERE id = NEW.user_id)
BEGIN
  SELECT RAISE(ABORT, 'home membership role must match user role');
END;

CREATE UNIQUE INDEX one_home_per_homeowner
  ON home_memberships(user_id)
  WHERE home_role = 'homeowner';

CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id, home_id)
);

CREATE TABLE device_types (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capabilities TEXT NOT NULL CHECK (json_valid(capabilities)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  device_type_id TEXT NOT NULL REFERENCES device_types(id),
  name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (json_valid(state)),
  status TEXT NOT NULL CHECK (status IN ('online', 'offline')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id, home_id),
  FOREIGN KEY (room_id, home_id) REFERENCES rooms(id, home_id) ON DELETE CASCADE
);

CREATE TABLE device_events (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('user', 'admin', 'simulator')),
  event_type TEXT NOT NULL,
  previous_state TEXT NOT NULL CHECK (json_valid(previous_state)),
  new_state TEXT NOT NULL CHECK (json_valid(new_state)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id, home_id),
  FOREIGN KEY (device_id, home_id) REFERENCES devices(id, home_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_event_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id, home_id) REFERENCES devices(id, home_id) ON DELETE CASCADE,
  FOREIGN KEY (device_event_id, home_id) REFERENCES device_events(id, home_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, home_id) REFERENCES home_memberships(user_id, home_id) ON DELETE CASCADE
);

CREATE TABLE notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_type_key TEXT REFERENCES device_types(key),
  event_type TEXT,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id, home_id) REFERENCES home_memberships(user_id, home_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX unique_notification_preference_scope
  ON notification_preferences(
    user_id,
    home_id,
    COALESCE(device_type_key, '__all_device_types__'),
    COALESCE(event_type, '__all_event_types__')
  );

CREATE INDEX idx_home_memberships_home_id ON home_memberships(home_id);
CREATE INDEX idx_rooms_home_id ON rooms(home_id);
CREATE INDEX idx_devices_home_id ON devices(home_id);
CREATE INDEX idx_devices_room_id ON devices(room_id);
CREATE INDEX idx_device_events_home_id ON device_events(home_id);
CREATE INDEX idx_device_events_device_id ON device_events(device_id);
CREATE INDEX idx_notifications_home_user ON notifications(home_id, user_id);
CREATE INDEX idx_notification_preferences_user_home ON notification_preferences(user_id, home_id);
