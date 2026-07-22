import { requireAdmin, requireHomeAccess } from "../auth/guards.js";
import { NotFoundError } from "../shared/errors.js";
import { requireNonEmptyString } from "../shared/validation.js";

function nextId(store, key, prefix) {
  store.counters[key] += 1;
  return `${prefix}_${store.counters[key]}`;
}

export function listAccessibleHomes(store, currentUser) {
  return store.homes.filter((home) => currentUser.accessibleHomeIds.includes(home.id));
}

export function getAccessibleHome(store, currentUser, homeId) {
  requireHomeAccess(store, currentUser, homeId);
  return store.homes.find((home) => home.id === homeId);
}

export function createHome(store, currentUser, payload) {
  requireAdmin(currentUser);
  const home = { id: nextId(store, "homes", "home"), name: requireNonEmptyString(payload?.name, "name") };
  store.homes.push(home);
  store.homeMemberships.push({
    id: `membership_admin_${home.id}`,
    userId: currentUser.id,
    homeId: home.id,
    homeRole: "admin",
  });
  currentUser.accessibleHomeIds.push(home.id);
  return home;
}

export function updateHome(store, currentUser, homeId, payload) {
  requireAdmin(currentUser);
  const home = getAccessibleHome(store, currentUser, homeId);
  home.name = requireNonEmptyString(payload?.name, "name");
  return home;
}

export function deleteHome(store, currentUser, homeId) {
  requireAdmin(currentUser);
  const home = getAccessibleHome(store, currentUser, homeId);
  store.devices = store.devices.filter((device) => device.homeId !== homeId);
  store.rooms = store.rooms.filter((room) => room.homeId !== homeId);
  store.homeMemberships = store.homeMemberships.filter((membership) => membership.homeId !== homeId);
  store.homes = store.homes.filter((candidate) => candidate.id !== homeId);
  currentUser.accessibleHomeIds = currentUser.accessibleHomeIds.filter((id) => id !== homeId);
  return home;
}

export function assertHomeExists(store, homeId) {
  const home = store.homes.find((candidate) => candidate.id === homeId);
  if (!home) {
    throw new NotFoundError("Home not found");
  }
  return home;
}
