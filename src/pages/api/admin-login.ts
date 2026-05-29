import type { NextApiRequest, NextApiResponse } from "next";

type Response = { ok: true } | { error: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body ?? {};
  const adminUser = process.env.ADMIN_USERNAME ?? "admin";
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminPass) {
    console.error("[ADMIN] ADMIN_PASSWORD not set in env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  console.log(`[ADMIN] Login attempt for username: ${username}`);
  console.log(`[ADMIN] Expected username: ${adminUser}`);
  console.log(`[ADMIN] Password match: ${password === adminPass}`);

  if (username === adminUser && password === adminPass) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: "Invalid credentials" });
}
