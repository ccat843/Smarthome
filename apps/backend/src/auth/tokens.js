import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthError } from "../shared/errors.js";

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(input, secret) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function createToken({ userId, issuedAt = Math.floor(Date.now() / 1000), ttlSeconds = 3600, secret }) {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({ sub: userId, iat: issuedAt, exp: issuedAt + ttlSeconds });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyToken(token, { secret, now = Math.floor(Date.now() / 1000) }) {
  const parts = token?.split(".");
  if (!parts || parts.length !== 3) {
    throw new AuthError("Invalid token");
  }

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new AuthError("Invalid token");
  }

  const decodedPayload = decodeJson(payload);
  if (!decodedPayload.sub || decodedPayload.exp < now) {
    throw new AuthError("Invalid token");
  }

  return decodedPayload;
}
