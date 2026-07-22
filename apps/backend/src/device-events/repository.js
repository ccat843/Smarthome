import { requireHomeAccess } from "../auth/guards.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";

function clone(value) {
  return structuredClone(value);
}

function nextEventId(store) {
  store.counters.deviceEvents += 1;
  return `device_event_${store.counters.deviceEvents}`;
}

export function createDeviceEvent(
  store,
  { homeId, deviceId, actorUserId = null, source, eventType, previousState, newState },
) {
  const device = store.devices.find(
    (candidate) => candidate.id === deviceId && candidate.homeId === homeId,
  );
  if (!device) {
    throw new ValidationError("device_id must belong to the requested home");
  }

  const event = {
    id: nextEventId(store),
    homeId,
    deviceId,
    actorUserId,
    source,
    eventType,
    previousState: clone(previousState),
    newState: clone(newState),
    createdAt: new Date().toISOString(),
  };
  store.deviceEvents.push(event);
  return formatDeviceEvent(event);
}

export function formatDeviceEvent(event) {
  return clone(event);
}

function getDeviceInHome(store, homeId, deviceId) {
  const device = store.devices.find(
    (candidate) => candidate.id === deviceId && candidate.homeId === homeId,
  );
  if (!device) {
    throw new NotFoundError("Device not found");
  }
  return device;
}

export function listDeviceEvents(store, currentUser, homeId, filters = {}) {
  requireHomeAccess(store, currentUser, homeId);
  let events = store.deviceEvents.filter((event) => event.homeId === homeId);

  if (filters.device_id) {
    getDeviceInHome(store, homeId, filters.device_id);
    events = events.filter((event) => event.deviceId === filters.device_id);
  }

  if (filters.event_type) {
    events = events.filter((event) => event.eventType === filters.event_type);
  }

  return events.map(formatDeviceEvent);
}

export function listEventsForDevice(store, currentUser, homeId, deviceId) {
  requireHomeAccess(store, currentUser, homeId);
  getDeviceInHome(store, homeId, deviceId);
  return store.deviceEvents
    .filter((event) => event.homeId === homeId && event.deviceId === deviceId)
    .map(formatDeviceEvent);
}
