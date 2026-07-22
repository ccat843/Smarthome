import { createAuthService } from "./auth/service.js";
import {
  createHome,
  deleteHome,
  getAccessibleHome,
  listAccessibleHomes,
  updateHome,
} from "./homes/repository.js";
import { createRoom, deleteRoom, getRoom, listRooms, updateRoom } from "./rooms/repository.js";
import { getDevice, listDevices, registerDevice, removeDevice, updateDevice } from "./devices/repository.js";
import { errorResponse, jsonResponse } from "./shared/http.js";
import { createMvpStore } from "./shared/mvp-data.js";

export const backendScaffold = {
  name: "Smart Home MVP backend",
  purpose: "Backend entry point with auth, home, room, and device route helpers.",
};

export function createBackendApp({ tokenSecret, store = createMvpStore() }) {
  const auth = createAuthService({ tokenSecret, store });

  function currentUserFrom(request) {
    return auth.authenticateBearerToken(request.headers?.authorization);
  }

  return {
    auth,
    store,

    handleRequest(request) {
      try {
        if (request.method === "POST" && request.path === "/auth/login") {
          return jsonResponse(200, auth.login(request.body ?? {}));
        }

        const currentUser = currentUserFrom(request);

        if (request.method === "GET" && request.path === "/auth/me") {
          return jsonResponse(200, { user: currentUser });
        }

        if (request.method === "GET" && request.path === "/homes") {
          return jsonResponse(200, { homes: listAccessibleHomes(store, currentUser) });
        }

        if (request.method === "POST" && request.path === "/homes") {
          return jsonResponse(201, { home: createHome(store, currentUser, request.body ?? {}) });
        }

        const homeMatch = request.path.match(/^\/homes\/([^/]+)$/);
        if (homeMatch) {
          const [, homeId] = homeMatch;
          if (request.method === "GET") {
            return jsonResponse(200, { home: getAccessibleHome(store, currentUser, homeId) });
          }
          if (request.method === "PATCH") {
            return jsonResponse(200, { home: updateHome(store, currentUser, homeId, request.body ?? {}) });
          }
          if (request.method === "DELETE") {
            return jsonResponse(200, { home: deleteHome(store, currentUser, homeId) });
          }
        }

        const roomsMatch = request.path.match(/^\/homes\/([^/]+)\/rooms$/);
        if (roomsMatch) {
          const [, homeId] = roomsMatch;
          if (request.method === "GET") {
            return jsonResponse(200, { rooms: listRooms(store, currentUser, homeId) });
          }
          if (request.method === "POST") {
            return jsonResponse(201, { room: createRoom(store, currentUser, homeId, request.body ?? {}) });
          }
        }

        const roomMatch = request.path.match(/^\/homes\/([^/]+)\/rooms\/([^/]+)$/);
        if (roomMatch) {
          const [, homeId, roomId] = roomMatch;
          if (request.method === "GET") {
            return jsonResponse(200, { room: getRoom(store, currentUser, homeId, roomId) });
          }
          if (request.method === "PATCH") {
            return jsonResponse(200, {
              room: updateRoom(store, currentUser, homeId, roomId, request.body ?? {}),
            });
          }
          if (request.method === "DELETE") {
            return jsonResponse(200, { room: deleteRoom(store, currentUser, homeId, roomId) });
          }
        }

        const devicesMatch = request.path.match(/^\/homes\/([^/]+)\/devices$/);
        if (devicesMatch) {
          const [, homeId] = devicesMatch;
          if (request.method === "GET") {
            return jsonResponse(200, { devices: listDevices(store, currentUser, homeId, request.query) });
          }
          if (request.method === "POST") {
            return jsonResponse(201, {
              device: registerDevice(store, currentUser, homeId, request.body ?? {}),
            });
          }
        }

        const deviceMatch = request.path.match(/^\/homes\/([^/]+)\/devices\/([^/]+)$/);
        if (deviceMatch) {
          const [, homeId, deviceId] = deviceMatch;
          if (request.method === "GET") {
            return jsonResponse(200, { device: getDevice(store, currentUser, homeId, deviceId) });
          }
          if (request.method === "PATCH") {
            return jsonResponse(200, {
              device: updateDevice(store, currentUser, homeId, deviceId, request.body ?? {}),
            });
          }
          if (request.method === "DELETE") {
            return jsonResponse(200, { device: removeDevice(store, currentUser, homeId, deviceId) });
          }
        }

        return jsonResponse(404, { error: "Not found" });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}
