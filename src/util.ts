export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });

export const error = (code: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ error: code, ...extra }, { status });

export const randomId = (bytes = 16) => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const randomOtp = () => {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const n = (buf[0]! << 24) | (buf[1]! << 16) | (buf[2]! << 8) | buf[3]!;
  return String(Math.abs(n) % 1_000_000).padStart(6, "0");
};

export const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
