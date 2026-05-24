const READ_PATHS = new Set([
  "/",
  "/feed",
  "/auth.md",
  "/.well-known/oauth-protected-resource",
  "/.well-known/oauth-authorization-server",
]);

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const url = new URL(req.url);

  if (READ_PATHS.has(url.pathname)) {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-max-age": "86400",
      },
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "null",
      "access-control-allow-methods": "",
      "access-control-max-age": "0",
    },
  });
}

export function withCors(req: Request, res: Response): Response {
  const url = new URL(req.url);
  if (!READ_PATHS.has(url.pathname)) return res;
  const headers = new Headers(res.headers);
  headers.set("access-control-allow-origin", "*");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
