import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createBackendApp } from "../backend/src/main.js";

const port = Number(process.env.PORT ?? 5173);
const rootDir = fileURLToPath(new URL(".", import.meta.url));
const backend = createBackendApp({ tokenSecret: "frontend-demo-token-secret-with-enough-entropy" });

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : undefined;
}

function isApiPath(pathname) {
  return pathname.startsWith("/auth") || pathname.startsWith("/homes");
}

async function handleApi(request, response, url) {
  try {
    const result = backend.handleRequest({
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      body: await readBody(request),
      headers: { authorization: request.headers.authorization },
    });
    sendJson(response, result.status, result.body);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

function resolveStaticPath(pathname) {
  if (pathname === "/") {
    return join(rootDir, "index.html");
  }
  const relativePath = pathname.replace(/^\//, "");
  const fullPath = normalize(join(rootDir, relativePath));
  if (!fullPath.startsWith(rootDir)) {
    return null;
  }
  return fullPath;
}

async function handleStatic(response, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "text/plain; charset=utf-8" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (isApiPath(url.pathname)) {
    await handleApi(request, response, url);
    return;
  }
  await handleStatic(response, url.pathname);
}).listen(port, () => {
  console.log(`Smart Home MVP frontend: http://localhost:${port}`);
});
