import { ClientStore } from "../db/index.ts";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Validate X-Client-Secret header and auto-register the client. */
export async function requireClient(
  req: Request,
): Promise<{ clientSecret: string } | Response> {
  const secret = req.headers.get("X-Client-Secret");
  if (!secret) {
    return json({ error: "Missing X-Client-Secret header" }, 401);
  }
  await ClientStore.upsert(secret);
  return { clientSecret: secret };
}
