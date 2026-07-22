import { requireHomeAccess } from "../auth/guards.js";
import { applyDeviceAction } from "../device-capabilities/actions.js";
import { createDeviceEvent } from "../device-events/repository.js";
import { createNotificationsForEvent } from "../notifications/repository.js";
import { ValidationError, NotFoundError } from "../shared/errors.js";
import { requireNonEmptyString, requireObject } from "../shared/validation.js";
import { formatDevice } from "./repository.js";

function getDeviceInHome(store, homeId, deviceId) {
  const device = store.devices.find(
    (candidate) => candidate.id === deviceId && candidate.homeId === homeId,
  );
  if (!device) {
    throw new NotFoundError("Device not found");
  }
  return device;
}

export function executeDeviceAction(store, currentUser, homeId, deviceId, payload) {
  requireHomeAccess(store, currentUser, homeId);
  const body = requireObject(payload, "action request");
  const action = requireNonEmptyString(body.action, "action");
  const params = body.params ?? {};
  const storedDevice = getDeviceInHome(store, homeId, deviceId);

  if (storedDevice.status !== "online") {
    throw new ValidationError("Device must be online to execute actions");
  }

  const device = formatDevice(store, storedDevice);
  const result = applyDeviceAction(device, action, params);
  storedDevice.state = result.newState;

  const source = currentUser.role === "admin" ? "admin" : "user";
  const events = result.eventTypes.map((eventType) =>
    createDeviceEvent(store, {
      homeId,
      deviceId,
      actorUserId: currentUser.id,
      source,
      eventType,
      previousState: result.previousState,
      newState: result.newState,
    }),
  );
  const notifications = events.flatMap((event) => createNotificationsForEvent(store, event));

  return { device: formatDevice(store, storedDevice), events, notifications };
}
