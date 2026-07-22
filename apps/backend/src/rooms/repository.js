import { requireAdmin, requireHomeAccess } from "../auth/guards.js";
import { NotFoundError } from "../shared/errors.js";
import { requireNonEmptyString } from "../shared/validation.js";

function nextRoomId(store) {
  store.counters.rooms += 1;
  return `room_${store.counters.rooms}`;
}

function getRoomInHome(store, homeId, roomId) {
  const room = store.rooms.find((candidate) => candidate.id === roomId && candidate.homeId === homeId);
  if (!room) {
    throw new NotFoundError("Room not found");
  }
  return room;
}

export function listRooms(store, currentUser, homeId) {
  requireHomeAccess(store, currentUser, homeId);
  return store.rooms.filter((room) => room.homeId === homeId);
}

export function getRoom(store, currentUser, homeId, roomId) {
  requireHomeAccess(store, currentUser, homeId);
  return getRoomInHome(store, homeId, roomId);
}

export function createRoom(store, currentUser, homeId, payload) {
  requireAdmin(currentUser);
  requireHomeAccess(store, currentUser, homeId);
  const room = { id: nextRoomId(store), homeId, name: requireNonEmptyString(payload?.name, "name") };
  store.rooms.push(room);
  return room;
}

export function updateRoom(store, currentUser, homeId, roomId, payload) {
  requireAdmin(currentUser);
  const room = getRoom(store, currentUser, homeId, roomId);
  room.name = requireNonEmptyString(payload?.name, "name");
  return room;
}

export function deleteRoom(store, currentUser, homeId, roomId) {
  requireAdmin(currentUser);
  const room = getRoom(store, currentUser, homeId, roomId);
  store.devices = store.devices.filter((device) => device.roomId !== roomId || device.homeId !== homeId);
  store.rooms = store.rooms.filter((candidate) => candidate.id !== roomId || candidate.homeId !== homeId);
  return room;
}
