export function jsonResponse(status, body) {
  return { status, body };
}

export function errorResponse(error) {
  return jsonResponse(error.status ?? 500, { error: error.message });
}
