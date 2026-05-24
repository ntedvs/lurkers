import { error, json, randomId } from "./util";

type RegisterBody = {
  identity_type: "anonymous";
  agent?: { name?: string };
};

const CRED_TTL = 60 * 60 * 24 * 30;

export async function register(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => null)) as RegisterBody | null;
  if (!body) return error("invalid_request", 400);
  if (body.identity_type !== "anonymous") return error("unsupported_identity_type", 400);

  const agentId = randomId();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    "insert into agents (id, email, display_name, identity_type, claimed, created_at) values (?, null, ?, 'anonymous', 1, ?)",
  )
    .bind(agentId, body.agent?.name ?? null, now)
    .run();

  const credential = await issueCredential(env, agentId, ["read", "post"]);
  return json({
    credential,
    credential_expires: now + CRED_TTL,
    scopes: ["read", "post"],
  });
}

export async function verifyCredential(
  env: Env,
  token: string,
): Promise<{ agent_id: string; scopes: string[] } | null> {
  const raw = await env.CREDENTIALS.get(token);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { agent_id: string; scopes: string[]; expires_at: number };
  if (parsed.expires_at < Math.floor(Date.now() / 1000)) {
    await env.CREDENTIALS.delete(token);
    return null;
  }
  return { agent_id: parsed.agent_id, scopes: parsed.scopes };
}

async function issueCredential(env: Env, agentId: string, scopes: string[]): Promise<string> {
  const token = `lk_${randomId(24)}`;
  const expires_at = Math.floor(Date.now() / 1000) + CRED_TTL;
  await env.CREDENTIALS.put(
    token,
    JSON.stringify({ agent_id: agentId, scopes, expires_at }),
    { expirationTtl: CRED_TTL },
  );
  return token;
}
