import { requireHomeAccess } from "../auth/guards.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { requireObject } from "../shared/validation.js";

const HEATER_TEMPERATURE_THRESHOLD_C = 2;
const MVP_DEVICE_TYPES = new Set(["light", "heater", "door_lock"]);

function clone(value) {
  return structuredClone(value);
}

function nextNotificationId(store) {
  store.counters.notifications += 1;
  return `notification_${store.counters.notifications}`;
}

function nextPreferenceId(store) {
  store.counters.notificationPreferences += 1;
  return `notification_preference_${store.counters.notificationPreferences}`;
}

function findHome(store, homeId) {
  const home = store.homes.find((candidate) => candidate.id === homeId);
  if (!home) {
    throw new NotFoundError("Home not found");
  }
  return home;
}

function findDevice(store, homeId, deviceId) {
  const device = store.devices.find(
    (candidate) => candidate.id === deviceId && candidate.homeId === homeId,
  );
  if (!device) {
    throw new NotFoundError("Device not found");
  }
  return device;
}

function deviceTypeFor(store, device) {
  const deviceType = store.deviceTypes.find((candidate) => candidate.id === device.deviceTypeId);
  if (!deviceType) {
    throw new ValidationError("Device type not found");
  }
  return deviceType;
}

function recipientsForHome(store, homeId) {
  return store.homeMemberships
    .filter((membership) => membership.homeId === homeId)
    .map((membership) => store.users.find((user) => user.id === membership.userId))
    .filter(Boolean);
}

function preferenceMatches(preference, deviceTypeKey, eventType) {
  const deviceTypeMatches = preference.deviceTypeKey === null || preference.deviceTypeKey === deviceTypeKey;
  const eventMatches = preference.eventType === null || preference.eventType === eventType;
  return deviceTypeMatches && eventMatches;
}

function notificationsEnabledFor(store, userId, homeId, deviceTypeKey, eventType) {
  const matching = store.notificationPreferences.filter(
    (preference) =>
      preference.userId === userId &&
      preference.homeId === homeId &&
      preferenceMatches(preference, deviceTypeKey, eventType),
  );
  if (matching.length === 0) {
    return true;
  }
  return matching.every((preference) => preference.enabled);
}

function formatNotification(notification) {
  return clone(notification);
}

function formatPreference(preference) {
  return clone(preference);
}

function describePowerChange(device, home, event) {
  const power = event.newState.power;
  if (!["on", "off"].includes(power)) {
    return null;
  }
  return {
    title: `${device.name} turned ${power}`,
    message: `${device.name} in ${home.name} was turned ${power}.`,
    severity: "info",
  };
}

function describeBrightnessChange(device, home, event) {
  if (typeof event.newState.brightness !== "number") {
    return null;
  }
  return {
    title: `${device.name} brightness changed`,
    message: `${device.name} in ${home.name} brightness was set to ${event.newState.brightness}%.`,
    severity: "info",
  };
}

function describeTargetTemperatureChange(device, event) {
  if (typeof event.newState.target_temperature_c !== "number") {
    return null;
  }
  return {
    title: `${device.name} target changed`,
    message: `${device.name} target temperature was set to ${event.newState.target_temperature_c}°C.`,
    severity: "info",
  };
}

function describeTemperatureChange(device, home, event) {
  const current = event.newState.current_temperature_c;
  const target = event.newState.target_temperature_c;
  if (typeof current !== "number" || typeof target !== "number") {
    return null;
  }
  if (Math.abs(current - target) <= HEATER_TEMPERATURE_THRESHOLD_C) {
    return null;
  }
  return {
    title: `${device.name} temperature warning`,
    message: `${device.name} in ${home.name} is ${current}°C with target ${target}°C.`,
    severity: "warning",
  };
}

function describeLockStateChange(device, home, event) {
  if (event.newState.lock_state === "unlocked") {
    return {
      title: `${device.name} unlocked`,
      message: `${device.name} in ${home.name} was unlocked.`,
      severity: "critical",
    };
  }
  if (event.newState.lock_state === "locked") {
    return {
      title: `${device.name} locked`,
      message: `${device.name} in ${home.name} was locked.`,
      severity: "info",
    };
  }
  return null;
}

function describeDeviceOffline(device, home, event) {
  if (event.newState.status !== "offline") {
    return null;
  }
  return {
    title: `${device.name} offline`,
    message: `${device.name} in ${home.name} went offline.`,
    severity: "warning",
  };
}

function notificationDetailsFor(store, event) {
  const home = findHome(store, event.homeId);
  const device = findDevice(store, event.homeId, event.deviceId);
  const deviceType = deviceTypeFor(store, device);

  const descriptors = {
    light: {
      power_changed: () => describePowerChange(device, home, event),
      brightness_changed: () => describeBrightnessChange(device, home, event),
      status_changed: () => describeDeviceOffline(device, home, event),
    },
    heater: {
      power_changed: () => describePowerChange(device, home, event),
      target_temperature_changed: () => describeTargetTemperatureChange(device, event),
      temperature_changed: () => describeTemperatureChange(device, home, event),
      status_changed: () => describeDeviceOffline(device, home, event),
    },
    door_lock: {
      lock_state_changed: () => describeLockStateChange(device, home, event),
      status_changed: () => describeDeviceOffline(device, home, event),
    },
  };

  const describe = descriptors[deviceType.key]?.[event.eventType];
  const details = describe ? describe() : null;
  return details ? { ...details, deviceTypeKey: deviceType.key } : null;
}

export function createNotificationsForEvent(store, event) {
  const details = notificationDetailsFor(store, event);
  if (!details) {
    return [];
  }

  return recipientsForHome(store, event.homeId)
    .filter((recipient) =>
      notificationsEnabledFor(store, recipient.id, event.homeId, details.deviceTypeKey, event.eventType),
    )
    .filter(
      (recipient) =>
        !store.notifications.some(
          (notification) => notification.deviceEventId === event.id && notification.userId === recipient.id,
        ),
    )
    .map((recipient) => {
      const notification = {
        id: nextNotificationId(store),
        homeId: event.homeId,
        deviceId: event.deviceId,
        deviceEventId: event.id,
        userId: recipient.id,
        title: details.title,
        message: details.message,
        severity: details.severity,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      store.notifications.push(notification);
      return formatNotification(notification);
    });
}

export function listNotifications(store, currentUser, homeId) {
  requireHomeAccess(store, currentUser, homeId);
  return store.notifications
    .filter((notification) => notification.homeId === homeId && notification.userId === currentUser.id)
    .map(formatNotification);
}

export function updateNotificationReadState(store, currentUser, homeId, notificationId, payload) {
  requireHomeAccess(store, currentUser, homeId);
  const body = requireObject(payload, "notification");
  if (typeof body.read !== "boolean") {
    throw new ValidationError("read must be a boolean");
  }
  const notification = store.notifications.find(
    (candidate) =>
      candidate.id === notificationId && candidate.homeId === homeId && candidate.userId === currentUser.id,
  );
  if (!notification) {
    throw new NotFoundError("Notification not found");
  }
  notification.readAt = body.read ? new Date().toISOString() : null;
  return formatNotification(notification);
}

export function listNotificationPreferences(store, currentUser, homeId) {
  requireHomeAccess(store, currentUser, homeId);
  return store.notificationPreferences
    .filter((preference) => preference.homeId === homeId && preference.userId === currentUser.id)
    .map(formatPreference);
}

function normalizePreference(rawPreference) {
  const preference = requireObject(rawPreference, "notification preference");
  const deviceTypeKey = preference.device_type_key ?? preference.deviceTypeKey ?? null;
  const eventType = preference.event_type ?? preference.eventType ?? null;

  if (deviceTypeKey !== null && !MVP_DEVICE_TYPES.has(deviceTypeKey)) {
    throw new ValidationError("device_type_key must be one of light, heater, or door_lock");
  }
  if (eventType !== null && (typeof eventType !== "string" || eventType.trim().length === 0)) {
    throw new ValidationError("event_type must be a non-empty string or null");
  }
  if (typeof preference.enabled !== "boolean") {
    throw new ValidationError("enabled must be a boolean");
  }

  return {
    deviceTypeKey,
    eventType: eventType === null ? null : eventType.trim(),
    enabled: preference.enabled,
  };
}

export function replaceNotificationPreferences(store, currentUser, homeId, payload) {
  requireHomeAccess(store, currentUser, homeId);
  const preferences = Array.isArray(payload) ? payload : payload.preferences;
  if (!Array.isArray(preferences)) {
    throw new ValidationError("preferences must be an array");
  }

  const normalized = preferences.map(normalizePreference);
  const scopes = new Set();
  for (const preference of normalized) {
    const scope = `${preference.deviceTypeKey ?? "*"}:${preference.eventType ?? "*"}`;
    if (scopes.has(scope)) {
      throw new ValidationError("duplicate notification preference scope");
    }
    scopes.add(scope);
  }

  store.notificationPreferences = store.notificationPreferences.filter(
    (preference) => !(preference.userId === currentUser.id && preference.homeId === homeId),
  );

  const now = new Date().toISOString();
  const created = normalized.map((preference) => {
    const storedPreference = {
      id: nextPreferenceId(store),
      userId: currentUser.id,
      homeId,
      deviceTypeKey: preference.deviceTypeKey,
      eventType: preference.eventType,
      enabled: preference.enabled,
      createdAt: now,
      updatedAt: now,
    };
    store.notificationPreferences.push(storedPreference);
    return formatPreference(storedPreference);
  });

  return created;
}
