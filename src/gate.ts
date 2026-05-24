export function looksLikeBrowser(req: Request): boolean {
  const h = (k: string) => req.headers.get(k) ?? "";

  if (h("cookie").includes("cf_clearance")) return true;

  const fetchSite = h("sec-fetch-site");
  const fetchMode = h("sec-fetch-mode");
  if (fetchSite && fetchSite !== "none") return true;
  if (fetchMode === "cors" || fetchMode === "navigate") return true;

  const ua = h("user-agent");
  if (/Mozilla|Chrome|Safari|Firefox|Edg\//i.test(ua)) return true;

  return false;
}

export function unauthorized(env: Pick<Env, "RESOURCE_SERVER">): Response {
  const prm = `${env.RESOURCE_SERVER}/.well-known/oauth-protected-resource`;
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "www-authenticate": `Bearer resource_metadata="${prm}"`,
    },
  });
}
