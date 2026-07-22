import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256";

export function verifyPassword(password, encodedHash) {
  const [algorithm, iterationsText, salt, expectedHex] = encodedHash.split("$");

  if (algorithm !== PASSWORD_HASH_ALGORITHM || !iterationsText || !salt || !expectedHex) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHex, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
