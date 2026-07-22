import { ValidationError } from "../shared/errors.js";
import { requireObject } from "../shared/validation.js";

function clone(value) {
  return structuredClone(value);
}

function hasAction(device, action) {
  return device.capabilities.some((capability) => capability.actions.includes(action));
}

function eventForChangedField(fieldName) {
  return {
    power: "power_changed",
    target_temperature_c: "target_temperature_changed",
    current_temperature_c: "temperature_changed",
    brightness: "brightness_changed",
    lock_state: "lock_state_changed",
  }[fieldName];
}

function changedFields(previousState, newState) {
  return Object.keys(newState).filter((fieldName) => previousState[fieldName] !== newState[fieldName]);
}

function requireNumber(value, fieldName) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  return value;
}

export function normalizeActionKey(action) {
  return {
    TURN_ON: "turn_on",
    TURN_OFF: "turn_off",
    SET_BRIGHTNESS: "set_brightness",
    SET_TEMPERATURE: "set_target_temperature",
    LOCK: "lock",
    UNLOCK: "unlock",
  }[action] ?? action;
}

export function validateDeviceAction(device, action, params = {}) {
  if (!hasAction(device, action)) {
    throw new ValidationError("Action is not supported by this device");
  }

  if (action === "set_target_temperature") {
    const body = requireObject(params, "params");
    requireNumber(body.target_temperature_c, "target_temperature_c");
    return;
  }

  if (action === "set_brightness") {
    const body = requireObject(params, "params");
    const brightness = requireNumber(body.brightness, "brightness");
    if (brightness < 0 || brightness > 100) {
      throw new ValidationError("brightness must be between 0 and 100");
    }
    return;
  }

  requireObject(params, "params");
}

export function applyDeviceAction(device, requestedAction, params = {}) {
  const action = normalizeActionKey(requestedAction);
  validateDeviceAction(device, action, params);
  const previousState = clone(device.state);
  const newState = clone(device.state);

  if (action === "turn_on") {
    newState.power = "on";
  } else if (action === "turn_off") {
    newState.power = "off";
  } else if (action === "set_target_temperature") {
    newState.target_temperature_c = params.target_temperature_c;
  } else if (action === "set_brightness") {
    newState.brightness = params.brightness;
  } else if (action === "lock") {
    newState.lock_state = "locked";
  } else if (action === "unlock") {
    newState.lock_state = "unlocked";
  }

  return {
    previousState,
    newState,
    eventTypes: changedFields(previousState, newState).map(eventForChangedField).filter(Boolean),
  };
}
