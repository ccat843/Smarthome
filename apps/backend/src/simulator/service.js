import { applyDeviceAction } from "../device-capabilities/actions.js";
import { createDeviceEvent } from "../device-events/repository.js";
import { createNotificationsForEvent } from "../notifications/repository.js";
import { formatDevice } from "../devices/repository.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { requireObject } from "../shared/validation.js";

function getDeviceInHome(store, homeId, deviceId) {
  const device = store.devices.find(
    (candidate) => candidate.id === deviceId && candidate.homeId === homeId,
  );
  if (!device) {
    throw new NotFoundError("Device not found");
  }
  return device;
}

function eventForStatusChange(previousStatus, newStatus) {
  return previousStatus === newStatus ? [] : ["status_changed"];
}

export function setSimulatedDeviceStatus(store, homeId, deviceId, status) {
  if (!["online", "offline"].includes(status)) {
    throw new ValidationError("status must be online or offline");
  }
  const device = getDeviceInHome(store, homeId, deviceId);
  const previousState = { ...device.state, status: device.status };
  device.status = status;
  const newState = { ...device.state, status: device.status };
  const events = eventForStatusChange(previousState.status, newState.status).map((eventType) =>
    createDeviceEvent(store, {
      homeId,
      deviceId,
      source: "simulator",
      eventType,
      previousState,
      newState,
    }),
  );
  const notifications = events.flatMap((event) => createNotificationsForEvent(store, event));
  return { device: formatDevice(store, device), events, notifications };
}

export function applySimulatorAction(store, homeId, deviceId, action, params = {}) {
  const device = formatDevice(store, getDeviceInHome(store, homeId, deviceId));
  const result = applyDeviceAction(device, action, params);
  const storedDevice = getDeviceInHome(store, homeId, deviceId);
  storedDevice.state = result.newState;
  const events = result.eventTypes.map((eventType) =>
    createDeviceEvent(store, {
      homeId,
      deviceId,
      source: "simulator",
      eventType,
      previousState: result.previousState,
      newState: result.newState,
    }),
  );
  const notifications = events.flatMap((event) => createNotificationsForEvent(store, event));
  return { device: formatDevice(store, storedDevice), events, notifications };
}

export function updateSimulatedTelemetry(store, homeId, deviceId, payload) {
  const body = requireObject(payload, "telemetry");
  const device = getDeviceInHome(store, homeId, deviceId);
  const formatted = formatDevice(store, device);
  if (!formatted.capabilities.some((capability) => capability.state_fields.includes("current_temperature_c"))) {
    throw new ValidationError("Device does not support temperature telemetry");
  }
  if (typeof body.current_temperature_c !== "number" || Number.isNaN(body.current_temperature_c)) {
    throw new ValidationError("current_temperature_c must be a number");
  }

  const previousState = structuredClone(device.state);
  device.state = { ...device.state, current_temperature_c: body.current_temperature_c };
  const event =
    previousState.current_temperature_c === device.state.current_temperature_c
      ? null
      : createDeviceEvent(store, {
          homeId,
          deviceId,
          source: "simulator",
          eventType: "temperature_changed",
          previousState,
          newState: device.state,
        });
  const notifications = event ? createNotificationsForEvent(store, event) : [];
  return { device: formatDevice(store, device), event, notifications };
}
