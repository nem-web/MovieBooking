import express from "express";
import crypto from "crypto";
import Booking from "../models/Booking.js";

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }), // capture raw body!
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const rawBodyBuffer = req.body; // <Buffer ...>
      const rawBodyString = rawBodyBuffer.toString("utf8"); // this is what Razorpay signs

      // ✅ Use this exact string to compute HMAC
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(rawBodyString)
        .digest("hex");

      console.log("[WEBHOOK] Razorpay Signature:", signature);
      console.log("[WEBHOOK] Expected Signature:", expectedSignature);

      if (signature !== expectedSignature) {
        console.error("[WEBHOOK] Invalid signature ❌");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      const event = JSON.parse(rawBodyString); // Safe to parse AFTER verification
      console.log("[WEBHOOK] Event Type:", event.event);

      if (event.event === "order.paid") {
        const orderId = event.payload.payment.entity.order_id;

        const booking = await Booking.findOne({ paymentLink: orderId });

        if (booking && booking.status !== "confirmed") {
          booking.status = "confirmed";
          await booking.save();
          console.log("[WEBHOOK] Booking confirmed ✅:", booking._id);
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[WEBHOOK] Error:", err.message);
      return res.status(500).json({ success: false });
    }
  }
);

export default router;
