import { AuthError, ForbiddenError, NotFoundError } from "../shared/errors.js";

export function requireAuthenticatedUser(currentUser) {
  if (!currentUser) {
    throw new AuthError("Authentication required");
  }
  return currentUser;
}

export function requireAdmin(currentUser) {
  requireAuthenticatedUser(currentUser);
  if (currentUser.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return currentUser;
}

export function canAccessHome(store, currentUser, homeId) {
  requireAuthenticatedUser(currentUser);
  return store.homeMemberships.some(
    (membership) => membership.userId === currentUser.id && membership.homeId === homeId,
  );
}

export function requireHomeAccess(store, currentUser, homeId) {
  const homeExists = store.homes.some((home) => home.id === homeId);
  if (!homeExists) {
    throw new NotFoundError("Home not found");
  }

  if (!canAccessHome(store, currentUser, homeId)) {
    throw new ForbiddenError("Home access denied");
  }

  return currentUser;
}

export function withProtectedRoute(handler) {
  return (request, context) => {
    requireAuthenticatedUser(context?.currentUser);
    return handler(request, context);
  };
}
