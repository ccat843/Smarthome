PRAGMA foreign_keys = ON;

INSERT INTO users (id, email, display_name, role) VALUES
  ('user_admin', 'admin@smarthome.local', 'MVP Admin', 'admin'),
  ('user_homeowner_1', 'homeowner1@smarthome.local', 'Homeowner 1', 'homeowner'),
  ('user_homeowner_2', 'homeowner2@smarthome.local', 'Homeowner 2', 'homeowner');

INSERT INTO homes (id, name) VALUES
  ('home_1', 'Home 1'),
  ('home_2', 'Home 2');

INSERT INTO home_memberships (id, user_id, home_id, home_role) VALUES
  ('membership_admin_home_1', 'user_admin', 'home_1', 'admin'),
  ('membership_admin_home_2', 'user_admin', 'home_2', 'admin'),
  ('membership_homeowner_1_home_1', 'user_homeowner_1', 'home_1', 'homeowner'),
  ('membership_homeowner_2_home_2', 'user_homeowner_2', 'home_2', 'homeowner');

INSERT INTO rooms (id, home_id, name) VALUES
  ('room_home_1_living', 'home_1', 'Living Room'),
  ('room_home_1_bedroom', 'home_1', 'Bedroom'),
  ('room_home_1_entry', 'home_1', 'Entry'),
  ('room_home_2_living', 'home_2', 'Living Room'),
  ('room_home_2_bedroom', 'home_2', 'Bedroom'),
  ('room_home_2_entry', 'home_2', 'Entry');

INSERT INTO device_types (id, key, name, capabilities) VALUES
  ('device_type_light', 'light', 'Light', '[{"key":"power","actions":["turn_on","turn_off"],"state_fields":["power"]}]'),
  ('device_type_heater', 'heater', 'Heater', '[{"key":"temperature_control","actions":["turn_on","turn_off","set_target_temperature"],"state_fields":["power","target_temperature_c","current_temperature_c"]}]'),
  ('device_type_door_lock', 'door_lock', 'Door Lock', '[{"key":"lock_control","actions":["lock","unlock"],"state_fields":["lock_state"]}]');

INSERT INTO devices (id, home_id, room_id, device_type_id, name, state, status) VALUES
  ('device_home_1_living_light', 'home_1', 'room_home_1_living', 'device_type_light', 'Living Room Light', '{"power":"on"}', 'online'),
  ('device_home_1_bedroom_heater', 'home_1', 'room_home_1_bedroom', 'device_type_heater', 'Bedroom Heater', '{"power":"off","target_temperature_c":21,"current_temperature_c":20}', 'online'),
  ('device_home_1_front_door', 'home_1', 'room_home_1_entry', 'device_type_door_lock', 'Front Door', '{"lock_state":"locked"}', 'online'),
  ('device_home_2_living_light', 'home_2', 'room_home_2_living', 'device_type_light', 'Living Room Light', '{"power":"off"}', 'online'),
  ('device_home_2_bedroom_heater', 'home_2', 'room_home_2_bedroom', 'device_type_heater', 'Bedroom Heater', '{"power":"off","target_temperature_c":21,"current_temperature_c":20}', 'online'),
  ('device_home_2_front_door', 'home_2', 'room_home_2_entry', 'device_type_door_lock', 'Front Door', '{"lock_state":"unlocked"}', 'online');

INSERT INTO device_events (id, home_id, device_id, actor_user_id, source, event_type, previous_state, new_state) VALUES
  ('event_home_1_light_turned_on', 'home_1', 'device_home_1_living_light', NULL, 'simulator', 'power_changed', '{"power":"off"}', '{"power":"on"}'),
  ('event_home_2_lock_unlocked', 'home_2', 'device_home_2_front_door', NULL, 'simulator', 'lock_state_changed', '{"lock_state":"locked"}', '{"lock_state":"unlocked"}');

INSERT INTO notifications (id, home_id, device_id, device_event_id, user_id, title, message, severity) VALUES
  ('notification_admin_home_1_light_on', 'home_1', 'device_home_1_living_light', 'event_home_1_light_turned_on', 'user_admin', 'Living Room Light turned on', 'Living Room Light in Home 1 was turned on.', 'info'),
  ('notification_homeowner_1_light_on', 'home_1', 'device_home_1_living_light', 'event_home_1_light_turned_on', 'user_homeowner_1', 'Living Room Light turned on', 'Living Room Light in Home 1 was turned on.', 'info'),
  ('notification_admin_home_2_lock_unlocked', 'home_2', 'device_home_2_front_door', 'event_home_2_lock_unlocked', 'user_admin', 'Front Door unlocked', 'Front Door in Home 2 was unlocked.', 'critical'),
  ('notification_homeowner_2_lock_unlocked', 'home_2', 'device_home_2_front_door', 'event_home_2_lock_unlocked', 'user_homeowner_2', 'Front Door unlocked', 'Front Door in Home 2 was unlocked.', 'critical');

INSERT INTO notification_preferences (id, user_id, home_id, device_type_key, event_type, enabled) VALUES
  ('preference_admin_home_1_all', 'user_admin', 'home_1', NULL, NULL, 1),
  ('preference_admin_home_2_all', 'user_admin', 'home_2', NULL, NULL, 1),
  ('preference_homeowner_1_home_1_all', 'user_homeowner_1', 'home_1', NULL, NULL, 1),
  ('preference_homeowner_2_home_2_all', 'user_homeowner_2', 'home_2', NULL, NULL, 1);
