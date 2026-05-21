import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type VerifyData = {
  success: boolean;
  message: string;
};

type ErrorData = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyData | ErrorData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required payment details" });
    }

    // Generate signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ error: "Payment gateway not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      res.status(400).json({
        error: "Invalid signature. Payment verification failed.",
      });
    }
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    const msg = error instanceof Error ? error.message : "Failed to verify payment";
    res.status(500).json({ error: msg });
  }
}