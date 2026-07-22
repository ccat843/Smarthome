import { AuthError } from "../shared/errors.js";
import { verifyPassword } from "./passwords.js";
import { createToken, verifyToken } from "./tokens.js";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export function createAuthService({ tokenSecret, tokenTtlSeconds = 3600, store } = {}) {
  if (!tokenSecret) {
    throw new Error("tokenSecret is required");
  }

  if (!store) {
    throw new Error("store is required");
  }

  function accessibleHomeIdsForUser(userId) {
    return store.homeMemberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.homeId);
  }

  function userWithHomes(user) {
    return {
      ...publicUser(user),
      accessibleHomeIds: accessibleHomeIdsForUser(user.id),
    };
  }

  return {
    login({ email, password }) {
      const normalizedEmail = email?.trim().toLowerCase();
      const user = store.users.find((candidate) => candidate.email === normalizedEmail);

      if (!user || !verifyPassword(password ?? "", user.passwordHash)) {
        throw new AuthError("Invalid email or password");
      }

      return {
        token: createToken({ userId: user.id, ttlSeconds: tokenTtlSeconds, secret: tokenSecret }),
        user: publicUser(user),
      };
    },

    authenticateBearerToken(authorizationHeader) {
      const [scheme, token] = authorizationHeader?.split(" ") ?? [];
      if (scheme !== "Bearer" || !token) {
        throw new AuthError("Bearer token required");
      }

      const payload = verifyToken(token, { secret: tokenSecret });
      const user = store.users.find((candidate) => candidate.id === payload.sub);
      if (!user) {
        throw new AuthError("Invalid token");
      }

      return userWithHomes(user);
    },

    me(authorizationHeader) {
      return this.authenticateBearerToken(authorizationHeader);
    },
  };
}
