import express from "express";
import crypto from "crypto";
import Booking from "../models/Booking.js";

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }), // Required for raw body
  async (req, res) => {
    try {
      const rawBody = req.body.toString("utf8");
      const signature = req.headers["x-razorpay-signature"];

      console.log("[WEBHOOK] Razorpay Signature:", signature);
      console.log("[WEBHOOK] Using Secret:", RAZORPAY_WEBHOOK_SECRET);

      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      console.log("[WEBHOOK] Expected Signature:", expectedSignature);

      if (signature !== expectedSignature) {
        console.error("[WEBHOOK] Invalid signature ❌");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      const event = JSON.parse(rawBody);
      console.log("[WEBHOOK] Verified Event:", event.event);

      // handle order.paid etc...
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[WEBHOOK] Error:", err);
      return res.status(500).json({ success: false });
    }
  }
);

export default router;
