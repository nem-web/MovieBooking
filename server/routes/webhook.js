// routes/webhook.js
import express from "express";
import crypto from "crypto";
import Booking from "../models/Booking.js"; // Make sure Booking.js also uses ESM

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const rawBody = req.body;
    const signature = req.headers["x-razorpay-signature"];
    const bodyStr = rawBody.toString("utf8");

    console.log("[WEBHOOK] Raw buffer:", rawBody);
    console.log("[WEBHOOK] Parsed string:", bodyStr);

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(bodyStr)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[WEBHOOK] Invalid signature");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(bodyStr);
    console.log("[WEBHOOK] Event:", event);

    // handle event...
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    res.status(500).json({ success: false });
  }
});


export default router;
