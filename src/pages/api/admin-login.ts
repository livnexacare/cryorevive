import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body ?? {};

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

  console.log("[ADMIN-LOGIN] Received username:", username);
  console.log("[ADMIN-LOGIN] Expected username:", ADMIN_USERNAME);
  console.log("[ADMIN-LOGIN] Username match:", username === ADMIN_USERNAME);
  console.log("[ADMIN-LOGIN] Password set:", !!ADMIN_PASSWORD);
  console.log("[ADMIN-LOGIN] Password length received:", password?.length);
  console.log("[ADMIN-LOGIN] Password length expected:", ADMIN_PASSWORD?.length);

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({
    error: "Invalid credentials",
    debug: {
      usernameMatch: username === ADMIN_USERNAME,
      passwordLengthMatch: password?.length === ADMIN_PASSWORD?.length,
      adminUsernameSet: !!ADMIN_USERNAME,
      adminPasswordSet: !!ADMIN_PASSWORD,
    },
  });
}
