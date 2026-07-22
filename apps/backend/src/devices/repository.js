import { requireAdmin, requireHomeAccess } from "../auth/guards.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { requireNonEmptyString, requireObject } from "../shared/validation.js";

function nextDeviceId(store) {
  store.counters.devices += 1;
  return `device_${store.counters.devices}`;
}

function clone(value) {
  return structuredClone(value);
}

function getDeviceTypeByKey(store, deviceTypeKey) {
  const key = requireNonEmptyString(deviceTypeKey, "device_type_key");
  const deviceType = store.deviceTypes.find((candidate) => candidate.key === key);
  if (!deviceType) {
    throw new ValidationError("device_type_key must be one of light, heater, or door_lock");
  }
  return deviceType;
}

function getRoomInHome(store, homeId, roomId) {
  const room = store.rooms.find((candidate) => candidate.id === roomId && candidate.homeId === homeId);
  if (!room) {
    throw new ValidationError("room_id must belong to the requested home");
  }
  return room;
}

function getDeviceInHome(store, homeId, deviceId) {
  const device = store.devices.find((candidate) => candidate.id === deviceId && candidate.homeId === homeId);
  if (!device) {
    throw new NotFoundError("Device not found");
  }
  return device;
}

export function formatDevice(store, device) {
  const deviceType = store.deviceTypes.find((candidate) => candidate.id === device.deviceTypeId);
  return {
    id: device.id,
    homeId: device.homeId,
    roomId: device.roomId,
    deviceTypeKey: deviceType.key,
    name: device.name,
    status: device.status,
    capabilities: clone(deviceType.capabilities),
    state: clone(device.state),
  };
}

export function listDevices(store, currentUser, homeId, filters = {}) {
  requireHomeAccess(store, currentUser, homeId);
  let devices = store.devices.filter((device) => device.homeId === homeId);

  if (filters.room_id) {
    getRoomInHome(store, homeId, filters.room_id);
    devices = devices.filter((device) => device.roomId === filters.room_id);
  }

  if (filters.device_type_key) {
    const deviceType = getDeviceTypeByKey(store, filters.device_type_key);
    devices = devices.filter((device) => device.deviceTypeId === deviceType.id);
  }

  return devices.map((device) => formatDevice(store, device));
}

export function getDevice(store, currentUser, homeId, deviceId) {
  requireHomeAccess(store, currentUser, homeId);
  return formatDevice(store, getDeviceInHome(store, homeId, deviceId));
}

export function registerDevice(store, currentUser, homeId, payload) {
  requireAdmin(currentUser);
  requireHomeAccess(store, currentUser, homeId);
  const body = requireObject(payload, "device");
  const name = requireNonEmptyString(body.name, "name");
  const roomId = requireNonEmptyString(body.room_id, "room_id");
  const deviceType = getDeviceTypeByKey(store, body.device_type_key);
  getRoomInHome(store, homeId, roomId);

  const device = {
    id: nextDeviceId(store),
    homeId,
    roomId,
    deviceTypeId: deviceType.id,
    name,
    state: clone(deviceType.defaultState),
    status: "online",
  };
  store.devices.push(device);
  return formatDevice(store, device);
}

export function updateDevice(store, currentUser, homeId, deviceId, payload) {
  requireAdmin(currentUser);
  const body = requireObject(payload, "device");
  const device = getDeviceInHome(store, homeId, deviceId);
  requireHomeAccess(store, currentUser, homeId);

  if (body.name !== undefined) {
    device.name = requireNonEmptyString(body.name, "name");
  }

  if (body.room_id !== undefined) {
    const roomId = requireNonEmptyString(body.room_id, "room_id");
    getRoomInHome(store, homeId, roomId);
    device.roomId = roomId;
  }

  return formatDevice(store, device);
}

export function removeDevice(store, currentUser, homeId, deviceId) {
  requireAdmin(currentUser);
  requireHomeAccess(store, currentUser, homeId);
  const device = getDeviceInHome(store, homeId, deviceId);
  store.devices = store.devices.filter(
    (candidate) => candidate.id !== deviceId || candidate.homeId !== homeId,
  );
  return formatDevice(store, device);
}
