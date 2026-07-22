export const mvpUsers = [
  {
    id: "user_admin",
    email: "admin@smarthome.local",
    displayName: "MVP Admin",
    role: "admin",
    passwordHash:
      "pbkdf2_sha256$210000$admin_static_salt$0a14ac04e2e445868d2c97138b94e7ce40a1c6af05e2b36265b0e38183dc78b9",
  },
  {
    id: "user_homeowner_1",
    email: "homeowner1@smarthome.local",
    displayName: "Homeowner 1",
    role: "homeowner",
    passwordHash:
      "pbkdf2_sha256$210000$homeowner_1_static_salt$bba0ace91c8e8ae6cd7737f820c30ed6898dfcb3cea9116010d0de1d0ab30ef0",
  },
  {
    id: "user_homeowner_2",
    email: "homeowner2@smarthome.local",
    displayName: "Homeowner 2",
    role: "homeowner",
    passwordHash:
      "pbkdf2_sha256$210000$homeowner_2_static_salt$889c0283a8c5ace38b55d1828e3cc4812c8b6f425563230b3556dfac8f45cd16",
  },
];

export const mvpHomes = [
  { id: "home_1", name: "Home 1" },
  { id: "home_2", name: "Home 2" },
];

export const mvpHomeMemberships = [
  { id: "membership_admin_home_1", userId: "user_admin", homeId: "home_1", homeRole: "admin" },
  { id: "membership_admin_home_2", userId: "user_admin", homeId: "home_2", homeRole: "admin" },
  {
    id: "membership_homeowner_1_home_1",
    userId: "user_homeowner_1",
    homeId: "home_1",
    homeRole: "homeowner",
  },
  {
    id: "membership_homeowner_2_home_2",
    userId: "user_homeowner_2",
    homeId: "home_2",
    homeRole: "homeowner",
  },
];

export const mvpRooms = [
  { id: "room_home_1_living", homeId: "home_1", name: "Living Room" },
  { id: "room_home_1_bedroom", homeId: "home_1", name: "Bedroom" },
  { id: "room_home_1_entry", homeId: "home_1", name: "Entry" },
  { id: "room_home_2_living", homeId: "home_2", name: "Living Room" },
  { id: "room_home_2_bedroom", homeId: "home_2", name: "Bedroom" },
  { id: "room_home_2_entry", homeId: "home_2", name: "Entry" },
];

export const mvpDeviceTypes = [
  {
    id: "device_type_light",
    key: "light",
    name: "Light",
    capabilities: [
      {
        key: "power",
        actions: ["turn_on", "turn_off", "set_brightness"],
        state_fields: ["power", "brightness"],
      },
    ],
    defaultState: { power: "off", brightness: 0 },
  },
  {
    id: "device_type_heater",
    key: "heater",
    name: "Heater",
    capabilities: [
      {
        key: "temperature_control",
        actions: ["turn_on", "turn_off", "set_target_temperature"],
        state_fields: ["power", "target_temperature_c", "current_temperature_c"],
      },
    ],
    defaultState: { power: "off", target_temperature_c: 21, current_temperature_c: 20 },
  },
  {
    id: "device_type_door_lock",
    key: "door_lock",
    name: "Door Lock",
    capabilities: [{ key: "lock_control", actions: ["lock", "unlock"], state_fields: ["lock_state"] }],
    defaultState: { lock_state: "locked" },
  },
];

export const mvpDevices = [
  {
    id: "device_home_1_living_light",
    homeId: "home_1",
    roomId: "room_home_1_living",
    deviceTypeId: "device_type_light",
    name: "Living Room Light",
    state: { power: "on", brightness: 100 },
    status: "online",
  },
  {
    id: "device_home_1_bedroom_heater",
    homeId: "home_1",
    roomId: "room_home_1_bedroom",
    deviceTypeId: "device_type_heater",
    name: "Bedroom Heater",
    state: { power: "off", target_temperature_c: 21, current_temperature_c: 20 },
    status: "online",
  },
  {
    id: "device_home_1_front_door",
    homeId: "home_1",
    roomId: "room_home_1_entry",
    deviceTypeId: "device_type_door_lock",
    name: "Front Door",
    state: { lock_state: "locked" },
    status: "online",
  },
  {
    id: "device_home_2_living_light",
    homeId: "home_2",
    roomId: "room_home_2_living",
    deviceTypeId: "device_type_light",
    name: "Living Room Light",
    state: { power: "off", brightness: 0 },
    status: "online",
  },
  {
    id: "device_home_2_bedroom_heater",
    homeId: "home_2",
    roomId: "room_home_2_bedroom",
    deviceTypeId: "device_type_heater",
    name: "Bedroom Heater",
    state: { power: "off", target_temperature_c: 21, current_temperature_c: 20 },
    status: "online",
  },
  {
    id: "device_home_2_front_door",
    homeId: "home_2",
    roomId: "room_home_2_entry",
    deviceTypeId: "device_type_door_lock",
    name: "Front Door",
    state: { lock_state: "unlocked" },
    status: "online",
  },
];

function clone(value) {
  return structuredClone(value);
}

export function createMvpStore() {
  return {
    users: clone(mvpUsers),
    homes: clone(mvpHomes),
    homeMemberships: clone(mvpHomeMemberships),
    rooms: clone(mvpRooms),
    deviceTypes: clone(mvpDeviceTypes),
    devices: clone(mvpDevices),
    deviceEvents: [],
    notifications: [],
    notificationPreferences: [],
    counters: {
      homes: 2,
      rooms: 6,
      devices: 6,
      deviceEvents: 0,
      notifications: 0,
      notificationPreferences: 0,
    },
  };
}
