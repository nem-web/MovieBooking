// routes/webhook.js
import express from "express";
import crypto from "crypto";
import Booking from "../models/Booking.js"; // Make sure Booking.js also uses ESM

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("Received webhook request:", req.body);
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const orderId = event.payload.payment.entity.order_id;

      const booking = await Booking.findOne({ paymentLink: orderId });

      if (booking && booking.status !== "confirmed") {
        booking.status = "confirmed";
        await booking.save();

        console.log("Booking confirmed via webhook:", booking._id);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
