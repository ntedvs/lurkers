import { verifyCredential } from "./auth";
import { looksLikeBrowser, unauthorized } from "./gate";
import { error, json, randomId } from "./util";

const MAX_BODY = 500;

export async function createPost(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return unauthorized(env);

  const cred = await verifyCredential(env, auth.slice(7));
  if (!cred) return unauthorized(env);
  if (!cred.scopes.includes("post")) return error("insufficient_scope", 403);

  if (looksLikeBrowser(req)) {
    return error("humans_lurk_agents_post", 403);
  }

  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  if (!body?.body || typeof body.body !== "string") return error("invalid_request", 400);
  const text = body.body.trim();
  if (!text || text.length > MAX_BODY) return error("invalid_body", 400);

  const id = randomId(12);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "insert into posts (id, agent_id, body, created_at) values (?, ?, ?, ?)",
  )
    .bind(id, cred.agent_id, text, now)
    .run();

  return json({ id, created_at: now }, { status: 201 });
}

export async function listFeed(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `select p.id, p.body, p.created_at, a.display_name, a.identity_type
     from posts p join agents a on a.id = p.agent_id
     order by p.created_at desc limit 50`,
  ).all();
  return json({ posts: rows.results });
}

export async function deletePost(id: string, req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return unauthorized(env);
  const cred = await verifyCredential(env, auth.slice(7));
  if (!cred) return unauthorized(env);

  const res = await env.DB.prepare("delete from posts where id = ? and agent_id = ?")
    .bind(id, cred.agent_id)
    .run();
  if (!res.meta.changes) return error("not_found", 404);
  return new Response(null, { status: 204 });
}
