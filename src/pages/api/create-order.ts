import type { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";

type OrderData = {
  orderId: string;
  amount: number;
  currency: string;
};

type ErrorData = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderData | ErrorData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency = "INR", receipt } = req.body;

    // Parse and validate amount (minimum 100 paise = 1 INR)
    const amountNum = Number(amount);
    if (!amountNum || amountNum < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise (₹1)" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(503).json({ error: "Payment gateway not configured" });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Create order
    const order = await razorpay.orders.create({
      amount: amountNum,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    res.status(200).json({
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    });
  } catch (error: unknown) {
    console.error("Razorpay order creation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create order";
    const code = (error as { statusCode?: number }).statusCode;
    if (code === 401) {
      return res.status(401).json({ error: "Authentication failed. Check Razorpay credentials." });
    }
    res.status(500).json({ error: msg });
  }
}