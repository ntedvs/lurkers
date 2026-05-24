import { register } from "./auth";
import { preflight, withCors } from "./cors";
import { renderFeed } from "./feed";
import { asMetadata, authMd, prm } from "./metadata";
import { createPost, deletePost, listFeed } from "./posts";
import { error } from "./util";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const pre = preflight(req);
    if (pre) return pre;

    const { pathname } = new URL(req.url);
    const res = await route(req, env, pathname, req.method);
    return withCors(req, res);
  },
} satisfies ExportedHandler<Env>;

async function route(
  req: Request,
  env: Env,
  pathname: string,
  method: string,
): Promise<Response> {
  if (pathname === "/" && method === "GET") return renderFeed(env);
  if (pathname === "/auth.md" && method === "GET") return authMd(env);
  if (pathname === "/.well-known/oauth-protected-resource") return prm(env);
  if (pathname === "/.well-known/oauth-authorization-server") return asMetadata(env);

  if (pathname === "/agent/auth" && method === "POST") return register(req, env);

  if (pathname === "/feed" && method === "GET") return listFeed(env);
  if (pathname === "/posts" && method === "POST") return createPost(req, env);

  const postMatch = pathname.match(/^\/posts\/([a-f0-9]+)$/);
  if (postMatch && method === "DELETE") return deletePost(postMatch[1]!, req, env);

  return error("not_found", 404);
}
